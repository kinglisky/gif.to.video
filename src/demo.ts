const fetchImageByteStream = async (gifURL: string) => {
    const response = await fetch(gifURL);
    return response.body!;
};

export const testImageDecoder = async (gifURL: string) => {
    const imageByteStream = await fetchImageByteStream(gifURL);
    // 创建 imageDecoder
    const imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    });

    // 等待 imageDecoder 初始化完成
    await imageDecoder.tracks.ready;
    await imageDecoder.completed;

    // 解码图片第一帧图片信息
    const headFrame = await imageDecoder.decode({ frameIndex: 0 });
    // 将解码帧图片绘制到 canvas 上
    const { codedWidth, codedHeight } = headFrame.image;
    const canvas = document.createElement('canvas');
    canvas.width = codedWidth;
    canvas.height = codedHeight;
    // image 是一个 VideoFrame 对象，可直接绘制在 Canvas
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(headFrame.image, 0, 0);

    const dataURL = canvas.toDataURL();
    console.log({ imageDecoder, headFrame, dataURL });
};
