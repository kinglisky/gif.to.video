import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { fetchArrayBuffer } from './utils';

const corePath = `/ffmpeg/ffmpeg-core.js`;
const workerPath = `/ffmpeg/ffmpeg-core.worker.js`;
const wasmPath = `/ffmpeg/ffmpeg-core.wasm`;

export function setupFFmpegTranscode(options: {
    gifURL: string;
    button: HTMLButtonElement;
    video: HTMLVideoElement;
    time: HTMLSpanElement;
}) {
    const startTranscode = async () => {
        options.time.innerText = '开始转码...';
        const startTime = new Date();
        const ffmpeg = createFFmpeg({
            log: true,
            corePath,
            workerPath,
            wasmPath,
        });
        await ffmpeg.load();
        const inputName = `input.gif`;
        const outputName = `output.webm`;
        const gifBuffer = await fetchArrayBuffer(options.gifURL);

        ffmpeg.FS('writeFile', inputName, new Uint8Array(gifBuffer));

        await ffmpeg.run(
            '-i',
            inputName,
            '-vf',
            // gif 图片的分辨率不满足偶数像素，转码会引起报错，这里做个修正
            'pad=ceil(iw/2)*2:ceil(ih/2)*2',
            '-movflags',
            'faststart',
            '-pix_fmt',
            'yuva420p',
            outputName
        );

        const webmUint8Array = ffmpeg.FS('readFile', outputName);
        const blob = new Blob([webmUint8Array], { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        options.video.src = url;

        ffmpeg.FS('unlink', inputName);
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;
    };

    options.button.addEventListener('click', startTranscode, false);
}
