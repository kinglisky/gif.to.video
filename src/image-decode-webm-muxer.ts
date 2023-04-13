import WebMMuxer from 'webm-muxer';

const fetchImageByteStream = async (gifURL: string) => {
    const response = await fetch(gifURL);
    return response.body!;
};

const createImageDecoder = async (
    imageByteStream: ReadableStream<Uint8Array>
) => {
    if (typeof ImageDecoder === 'undefined') {
        return;
    }

    const imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    });

    await imageDecoder.tracks.ready;
    await imageDecoder.completed;

    console.log('imageDecoder', imageDecoder);
    return imageDecoder;
};

const decodeGifMuxWebM = async (
    imageDecoder: ImageDecoder,
    size: { width: number; height: number }
) => {
    const { image: headFrame } = await imageDecoder.decode({ frameIndex: 0 });
    const frameDuration = headFrame.duration! / 1000;
    const frameCount = imageDecoder.tracks.selectedTrack!.frameCount;

    return new Promise<string>((resolve) => {
        const webmMuxer = new WebMMuxer({
            target: 'buffer',
            video: {
                codec: 'V_VP9',
                width: size.width,
                height: size.height,
                frameRate: 1000 / frameDuration,
                alpha: true,
            },
        });

        let frameIndex = 0;

        const webmVideoEncoder = new VideoEncoder({
            output: async (chunk, meta) => {
                webmMuxer.addVideoChunk(chunk, meta);

                // 转码结束
                if (frameIndex === frameCount) {
                    await webmVideoEncoder.flush();

                    const webmBuffer = webmMuxer.finalize()!;
                    // webmVideoEncoder.close();
                    const webmBlobURL = URL.createObjectURL(
                        new Blob([webmBuffer])
                    );
                    resolve(webmBlobURL);
                }
            },
            error: (e) => console.error(e),
        });

        webmVideoEncoder.configure({
            codec: 'vp09.00.10.08',
            width: size.width,
            height: size.height,
            bitrate: 1e6,
        });

        const writeVideoFrame = async () => {
            if (frameIndex >= frameCount) return;

            const result = await imageDecoder.decode({ frameIndex });
            webmVideoEncoder.encode(result.image, { keyFrame: true });
            result.image.close();
            frameIndex += 1;

            await writeVideoFrame();
        };

        writeVideoFrame();
    });
};

export function setupImageDecodeMuxWebm(options: {
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

        const webmBlobURL = await decodeGifMuxWebM(imageDecoder, {
            width: image.naturalWidth,
            height: image.naturalHeight,
        });

        options.video.src = webmBlobURL;

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;
    };

    options.button.addEventListener('click', startTranscode, false);
}
