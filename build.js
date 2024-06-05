import { build } from 'esbuild';
//import { copy } from 'fs-extra';


const buildOptions = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'dist/main.js',
    platform: 'node',
    format: 'esm',  // Specify ESM output format
    sourcemap: true,
    target: 'node16',  // Ensure compatibility with Node.js 16
    tsconfig: 'tsconfig.json',
    packages: 'external',
  };

async function runBuild() {
  try {
    await build(buildOptions);
    //await copy('src/config.toml', 'dist/config.toml');
    console.log('Build succeeded');
  } catch (error) {
    console.error('Build failed:', error);
  }
}

runBuild();
