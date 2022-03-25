import {Config} from 'remotion';

Config.Rendering.setImageFormat('jpeg');
Config.Output.setOverwriteOutput(true);
Config.Puppeteer.setChromiumOpenGlRenderer('angle');
