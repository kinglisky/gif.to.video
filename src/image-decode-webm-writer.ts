// @ts-ignore
import WebMWriter from 'webm-writer';

const fetchImageByteStream = async (gifURL: string) => {
    const response = await fetch(gifURL);
    return response.body!;
};

const createImageDecoder = async (imageByteStream: ReadableStream<Uint8Array>) => {
    const imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    });

    await imageDecoder.tracks.ready;
    await imageDecoder.completed;
    return imageDecoder;
};

const decodeGifToWebM = async (imageDecoder: ImageDecoder) => {
    const frameCount = imageDecoder.tracks.selectedTrack!.frameCount;
    const { image: headFrame } = await imageDecoder.decode({ frameIndex: 0 });
    const frameDuration = headFrame.duration! / 1000;

    console.log({ headFrame, frameCount, frameDuration });

    const canvas = document.createElement('canvas');
    canvas.width = headFrame.codedWidth;
    canvas.height = headFrame.codedHeight;
    const canvasContext = canvas.getContext('2d')!;

    const videoWriter = new WebMWriter({
        quality: 1, // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported
        fileWriter: null, // FileWriter in order to stream to a file instead of buffering to memory (optional)
        fd: null, // Node.js file handle to write to instead of buffering to memory (optional)

        // You must supply one of:
        frameDuration, // Duration of frames in milliseconds
        frameRate: 1000 / frameDuration, // Number of frames per second

        transparent: true, // True if an alpha channel should be included in the video
        alphaQuality: 1, // Allows you to set the quality level of the alpha channel separately.
        // If not specified this defaults to the same value as `quality`.
    });

    const writeVideoFrame = async (frameIndex: number = 0) => {
        if (frameIndex >= frameCount) return;

        const result = await imageDecoder.decode({ frameIndex });
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(result.image, 0, 0);
        videoWriter.addFrame(canvas);

        await writeVideoFrame(frameIndex + 1);
    };

    await writeVideoFrame();

    const webMBlob: Blob = await videoWriter.complete();
    return URL.createObjectURL(webMBlob);
};

export function setupImageDecodeWriteWebm(options: {
    inputGif: HTMLImageElement;
    button: HTMLButtonElement;
    video: HTMLVideoElement;
    time: HTMLSpanElement;
}) {
    const startTranscode = async () => {
        options.time.innerText = '开始转码...';
        const startTime = new Date();

        const image = options.inputGif;
        const imageByteStream = await fetchImageByteStream(image.src);
        const imageDecoder = await createImageDecoder(imageByteStream);
        const webmBlobURL = await decodeGifToWebM(imageDecoder);

        options.video.src = webmBlobURL;

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;
    };

    options.button.addEventListener('click', startTranscode, false);
}
