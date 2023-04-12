import { setupFFmpegTranscode } from './ffmpeg-transcode';
import { setupFFmpegMergeFrames } from './ffmpeg-merge-frames';
import { setupParseGifToWebm } from './gifuct-to-webm';
import { setupImageDecodeWriteWebm } from './image-decode-webm-writer';
import { setupImageDecodeMuxWebm } from './image-decode-webm-muxer';

import appHTML from './app.html?raw';
// import gifURL from '/nichijo.gif';
import gifURL from '/giphy.gif';

import './style.css';

(async function startup() {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = appHTML;
    document.querySelector<HTMLImageElement>('#input-gif')!.src = gifURL;

    /**
     * FFmepg 直接转码
     */
    setupFFmpegTranscode({
        gifURL: gifURL,
        button: document.querySelector<HTMLButtonElement>(
            '#ffmpeg-transcode-btn'
        )!,
        video: document.querySelector<HTMLVideoElement>(
            '#ffmpeg-transcode-video'
        )!,
        time: document.querySelector<HTMLSpanElement>(
            '#ffmpeg-transcode-time'
        )!,
    });

    /**
     * 解析 Gif 图片帧后由 FFmepg 合成视频
     */
    setupFFmpegMergeFrames({
        gifURL: gifURL,
        button: document.querySelector<HTMLButtonElement>(
            '#ffmpeg-frames-btn'
        )!,
        video: document.querySelector<HTMLVideoElement>(
            '#ffmpeg-frames-video'
        )!,
        time: document.querySelector<HTMLSpanElement>('#ffmpeg-frames-time')!,
    });

    /**
     * 解析 Gif 图片然后由 webm-writer 生成 webM 视频
     */
    setupParseGifToWebm({
        gifURL: gifURL,
        button: document.querySelector<HTMLButtonElement>('#parse-gif-btn')!,
        video: document.querySelector<HTMLVideoElement>('#parse-gif-video')!,
        time: document.querySelector<HTMLSpanElement>('#parse-gif-time')!,
    });

    /**
     * 使用 ImageDecoder 解析 Gif 图片然后由 webm-writer 生成 webM 视频
     */
    setupImageDecodeWriteWebm({
        gifURL: gifURL,
        button: document.querySelector<HTMLButtonElement>('#web-codecs-btn')!,
        video: document.querySelector<HTMLVideoElement>('#web-codecs-video')!,
        time: document.querySelector<HTMLSpanElement>('#web-codecs-time')!,
    });

    /**
     * 使用 ImageDecoder 解析 Gif 图片然后由 webm-muxer 生成 webM 视频
     */
    setupImageDecodeMuxWebm({
        gifURL: gifURL,
        button: document.querySelector<HTMLButtonElement>(
            '#web-codecs-mux-btn'
        )!,
        video: document.querySelector<HTMLVideoElement>(
            '#web-codecs-mux-video'
        )!,
        time: document.querySelector<HTMLSpanElement>('#web-codecs-mux-time')!,
    });
})();
