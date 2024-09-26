// @ts-check

import { firehose } from 'coldsky/package/firehose';
import { allQuoting } from 'coldsky/package/data/capture-records/compact-post-quotes';
import { makeClock } from './clock';
import { handleWindowResizes } from './handle-window-resize';
import { layoutCalculator } from './layout-calculator';
import { layoutCalculatorCpu } from './layout-calculator-cpu';
import { setupScene } from './setup-scene';
import { staticShaderRenderer } from './static-shader-renderer';
import { BoxGeometry, EdgesGeometry, LineBasicMaterial, LineSegments } from 'three';
import { initAnimation } from './init-animation';

/**
 * @typedef {import('./static-shader-renderer').Particle &
 *  import('coldsky/package/firehose').FirehoseRecord$Typed<'app.bsky.feed.post'>} RecordParticle
 */


console.log('firehose ', firehose);
console.log('layoutCalculator ', layoutCalculator);
console.log('staticShaderRenderer ', staticShaderRenderer);

run();

async function run() {
  const loadingElement = /** @type {HTMLElement} */(document.getElementById('loading'));
  const countLoaded = 0 +
    (typeof layoutCalculator === 'undefined' ? 0 : 1) +
    (typeof staticShaderRenderer === 'undefined' ? 0 : 1);
  console.log({ countLoaded });
  loadingElement.textContent = (loadingElement.textContent || '').replace(/\.+$/, '') + [...Array(countLoaded)].map(x => '.').join('');

  const clock = makeClock();

  const {
    scene,
    camera,
    lights,
    renderer,
    stats,
    orbit
  } = setupScene(clock);

  const box = new BoxGeometry(1, 1, 1);
  const edges = new EdgesGeometry(box);
  const line = new LineSegments(edges, new LineBasicMaterial({ color: 0xffffff }));
  scene.add(line);

  document.body.appendChild(renderer.domElement);

  loadingElement.textContent = localise('Connecting...', {
    uk: 'З’єднання...'
  });

  handleWindowResizes(camera, renderer);
  const startWaitingForFirehose = Date.now();

  let staticRenderer;
  let layoutCalc;

  /** @type {RecordParticle[]} */
  let points = [];

  /** @type {Map<string | undefined, RecordParticle>} */
  let pointByUri = new Map();

  /** @type {[from : RecordParticle, to: RecordParticle][]} */
  let links = [];

  let lastLayoutCalc = 0;

  let animation = false;

  for await (const chunk of firehose()) {

    const updateCount = initPopulatePoints(chunk.messages);
    if (!updateCount) continue;

    if (!animation) {
      animation = true;
      initAnimation({
        camera,
        clock,
        scene,
        renderer,
      });
    }

    if (points.length < 3 || links.length < 2) {
      if (pointByUri.size > 1) {
        loadingElement.textContent = localise('Pulling initial ' + pointByUri.size.toLocaleString() + ' messages in ' + Math.round((Date.now() - startWaitingForFirehose) / 1000) + 's.', {
          uk: 'Завантажено ' + pointByUri.size.toLocaleString() + ' повідомлень за ' + Math.round((Date.now() - startWaitingForFirehose) / 1000) + 'с.'
        });
      }

    } else {
      if (!staticRenderer) {
        loadingElement.textContent = localise('Connected in ' + ((Date.now() - startWaitingForFirehose) / 1000) + 's.', {
          uk: 'З’єднано за ' + ((Date.now() - startWaitingForFirehose) / 1000) + 'с.'
        });
        fadeOutCaption(loadingElement);

        staticRenderer = staticShaderRenderer({
          clock,
          nodes: points,
          massScale: 0.001
        });
        scene.add(staticRenderer.mesh);
      } else {
        staticRenderer.updateNodes({ nodes: points });
      }

      const now = Date.now();
      if (now - lastLayoutCalc > 80) {
        layoutCalculatorCpu({
          nodes: points,
          edges: links
        });
        const afterLayout = Date.now();
        lastLayoutCalc = afterLayout;
        window['points'] = points;
        window['links'] = links;
      }
    }
  }

  /**
   * @param {import('coldsky/package/firehose').FirehoseRecord[]} records
   */
  function initPopulatePoints(records) {
    let updateCount = 0;
    for (const rec of records) {
      switch (rec.$type) {
        case 'app.bsky.feed.post':
          if (pointByUri.has(rec.uri)) continue;

          const particle = /** @type {RecordParticle} */(rec);
          initPostParticle(particle);
          pointByUri.set(particle.uri, particle);
          updateCount++;

          const replyRoot = pointByUri.get(particle.reply?.root.uri);
          const replyParent = pointByUri.get(particle.reply?.parent.uri);

          let anyLinksAdded = false;

          if (replyRoot) {
            links.push([particle, replyRoot]);
            if (replyRoot.mass === 1) points.push(replyRoot);
            replyRoot.mass++;
            anyLinksAdded = true;
          }

          if (replyParent && replyParent !== replyRoot) {
            links.push([particle, replyParent]);
            if (replyParent.mass === 1) points.push(replyParent);
            replyParent.mass++;
            anyLinksAdded = true;
          }


          const quoting = allQuoting(rec);
          if (quoting?.length) {
            for (const q of quoting) {
              const quoted = pointByUri.get(q);
              if (quoted && quoted !== replyRoot && quoted !== replyParent) {
                links.push([particle, quoted]);
                if (quoted.mass === 1) points.push(quoted);
                quoted.mass++;
                anyLinksAdded = true;
              }
            }
          }

          if (anyLinksAdded) {
            if (particle.mass === 1) points.push(particle);
            particle.mass++;
          }
          break;
        
        case 'app.bsky.feed.like':
          const likedParticle = pointByUri.get(rec.subject?.uri);
          if (likedParticle) {
            if (likedParticle.mass === 1) points.push(likedParticle);
            likedParticle.mass += 1;
          }
          updateCount++;
          break;
        
        case 'app.bsky.feed.repost':
          const repostedParticle = pointByUri.get(rec.subject?.uri);
          if (repostedParticle) {
            if (repostedParticle.mass === 1) points.push(repostedParticle);
            repostedParticle.mass += 1;
          }
          updateCount++;
          break;
      }
    }

    return updateCount;
  }

  /**
   * @param {RecordParticle} particle
   */
  function initPostParticle(particle) {
    particle.x = Math.random() * 0.1 - 0.05;
    particle.y = Math.random() * 0.1 - 0.05;
    particle.mass = 1;
    particle.color = 0xffffffff;
  }

  /**
   * @param {HTMLElement} loadingElement
   */
  async function fadeOutCaption(loadingElement) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadingElement.style.opacity = '0.2';
    await new Promise(resolve => setTimeout(resolve, 2000));
    loadingElement.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
