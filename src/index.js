// @ts-check

import coldsky, { firehose } from 'coldsky';
import { layoutCalculator } from './layout-calculator';
import { staticShaderRenderer } from './static-shader-renderer';
import { makeClock } from './clock';
import { setupScene } from './setup-scene';
import { handleWindowResizes } from './handle-window-resize';

console.log('coldsky ', coldsky);
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

  document.body.appendChild(renderer.domElement);

  loadingElement.textContent = localise('Connecting...', {
    uk: 'З’єднання...'
  })

  handleWindowResizes(camera, renderer);

  let firstArrived = false;
  const startWaitingForFirehose = Date.now();
  for await (const chunk of firehose()) {
    if (!firstArrived) {
      firstArrived = true;
      loadingElement.textContent = localise('Connected in ' + ((Date.now() - startWaitingForFirehose) / 1000) + 's.', {
        uk: 'З’єднано за ' + ((Date.now() - startWaitingForFirehose) / 1000) + 'с.'
      });
      setTimeout(() => {
        loadingElement.style.opacity = 0.2;
        setTimeout(() => {
          loadingElement.style.opacity = 0;
        }, 2000);
      }, 1000);
    }
  }
}