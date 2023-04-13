import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { fetchArrayBuffer } from './utils';

const corePath = `/ffmpeg/ffmpeg-core.js`;
const workerPath = `/ffmpeg/ffmpeg-core.worker.js`;
const wasmPath = `/ffmpeg/ffmpeg-core.wasm`;

export function setupFFmpegMergeFrames(options: {
    inputGif: HTMLImageElement;
    button: HTMLButtonElement;
    video: HTMLVideoElement;
    time: HTMLSpanElement;
}) {
    const getGifFrames = async (gifUrl: string) => {
        // 加载GIF
        const gifBuffer = await fetchArrayBuffer(gifUrl);
        const gif = parseGIF(gifBuffer);
        const frames = decompressFrames(gif, true);
        return { frames, gif };
    };

    const getCanvasFrame = (canvas: HTMLCanvasElement) => {
        return new Promise<Uint8Array>((resolve) => {
            canvas.toBlob(
                async (blob) => {
                    const buf = await blob!.arrayBuffer();
                    const data = new Uint8Array(buf);
                    resolve(data);
                },
                'image/png',
                1
            );
        });
    };

    const startTranscode = async () => {
        options.time.innerText = '加载 ffmepg.wasm';
        const ffmpeg = createFFmpeg({
            log: true,
            corePath,
            workerPath,
            wasmPath,
        });
        await ffmpeg.load();

        options.time.innerText = '开始转码...';
        const startTime = new Date();

        const { frames } = await getGifFrames(options.inputGif.src);
        const canvas = document.createElement('canvas');
        canvas.width = frames[0].dims.width;
        canvas.height = frames[0].dims.height;

        let index = 0;
        for (let frame of frames) {
            const ctx = canvas.getContext('2d')!;
            const data = new ImageData(
                frame.patch,
                frame.dims.width,
                frame.dims.height
            );
            ctx.putImageData(data, frame.dims.left, frame.dims.top);
            const frameData = await getCanvasFrame(canvas);
            const imageName = `frame${String(index).padStart(4, '0')}.png`;
            ffmpeg.FS('writeFile', imageName, frameData);
            index += 1;
        }

        const outputName = `output.webm`;

        await ffmpeg.run(
            '-framerate',
            String(1000 / frames[0].delay),
            '-i',
            'frame%04d.png',
            '-pix_fmt',
            'yuva420p',

            outputName
        );

        const webmUint8Array = ffmpeg.FS('readFile', outputName);
        const blob = new Blob([webmUint8Array], { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        options.video.src = url;

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;

        ffmpeg.exit();
    };

    options.button.addEventListener('click', startTranscode, false);
}
