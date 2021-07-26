const createRecorder = (canvas) => {
  let url = "";
  const chunks = [];
  const stream = canvas.captureStream(120);

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm; codecs=vp9",
  });

  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, {
      type: "video/webm",
    });
    url = URL.createObjectURL(blob);
  };

  return {
    startRecord: () => mediaRecorder.start(),
    stopRecord: async () => {
      mediaRecorder.stop();
      while (!url) {
        await sleep(10);
      }
      return url;
    },
  };
};
