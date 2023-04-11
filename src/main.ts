import { setupFFmpegTranscode } from './ffmpeg-transcode';
import { setupFFmpegMergeFrames } from './ffmpeg-merge-frames';
import { setupParseGifToWebm } from './gifuct-to-webm';
import { setupWebCodesGifToWebm } from './web-codes';

// import gifURL from '/nichijo.gif';
import gifURL from '/giphy.gif';

import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="item-container">
      <img src="${gifURL}"/>
    </div>
    <div class="item-container">
      <video id="ffmpeg-transcode-video" loop muted autoplay controls></video>
      <div class="item-info">
        <button id="ffmpeg-transcode-btn">FFmepg 直接转码 Gif</button>
        <p id="ffmpeg-transcode-time">用时：---</p>
      </div>
    </div>
    <div class="item-container">
      <video id="ffmpeg-frames-video" loop muted autoplay controls></video>
      <div class="item-info">
        <button id="ffmpeg-frames-btn">FFmepg 合并 Gif 图片帧</button>
        <p id="ffmpeg-frames-time">用时：---</p>
      </div>
    </div>
    <div class="item-container">
      <video id="parse-gif-video" loop muted autoplay controls></video>
      <div class="item-info">
        <button id="parse-gif-btn">Parse to WebM</button>
        <p id="parse-gif-time">用时：---</p>
      </div>
    </div>
     <div class="item-container">
      <video id="web-codecs-video" loop muted autoplay controls></video>
      <div class="item-info">
        <button id="web-codecs-btn">WebCodecs 转码</button>
        <p id="web-codecs-time">用时：---</p>
      </div>
    </div>
  </div>
`;

setupFFmpegTranscode({
    gifURL: gifURL,
    button: document.querySelector<HTMLButtonElement>('#ffmpeg-transcode-btn')!,
    video: document.querySelector<HTMLVideoElement>('#ffmpeg-transcode-video')!,
    time: document.querySelector<HTMLSpanElement>('#ffmpeg-transcode-time')!,
});

setupFFmpegMergeFrames({
    gifURL: gifURL,
    button: document.querySelector<HTMLButtonElement>('#ffmpeg-frames-btn')!,
    video: document.querySelector<HTMLVideoElement>('#ffmpeg-frames-video')!,
    time: document.querySelector<HTMLSpanElement>('#ffmpeg-frames-time')!,
});

setupParseGifToWebm({
    gifURL: gifURL,
    button: document.querySelector<HTMLButtonElement>('#parse-gif-btn')!,
    video: document.querySelector<HTMLVideoElement>('#parse-gif-video')!,
    time: document.querySelector<HTMLSpanElement>('#parse-gif-time')!,
});

setupWebCodesGifToWebm({
    gifURL: gifURL,
    button: document.querySelector<HTMLButtonElement>('#web-codecs-btn')!,
    video: document.querySelector<HTMLVideoElement>('#web-codecs-video')!,
    time: document.querySelector<HTMLSpanElement>('#web-codecs-time')!,
});
