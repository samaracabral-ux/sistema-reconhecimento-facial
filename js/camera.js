(() => {
  const video = document.getElementById("video");
  const status = document.getElementById("cameraStatus");
  const openBtn = document.getElementById("abrirCamera");
  const identifyBtn = document.getElementById("identificar");
  const stopBtn = document.getElementById("pararCamera");
  const placeholder = document.getElementById("cameraPlaceholder");
  let stream = null, modelsReady = false;

  async function loadModels() {
    if (modelsReady) return;
    status.textContent = "Carregando modelos faciais...";
    const base = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(base),
      faceapi.nets.faceLandmark68Net.loadFromUri(base),
      faceapi.nets.faceRecognitionNet.loadFromUri(base)
    ]);
    modelsReady = true;
  }

  openBtn.addEventListener("click", async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Seu navegador não oferece acesso à câmera. Use localhost ou HTTPS.");
      await loadModels();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      video.srcObject = stream;
      await video.play();
      placeholder.hidden = true;
      openBtn.disabled = true; identifyBtn.disabled = false; stopBtn.disabled = false;
      status.textContent = "Câmera ativa. Posicione o rosto e clique em Identificar rosto.";
    } catch (error) {
      status.textContent = error.message || "Não foi possível abrir a câmera.";
    }
  });

  stopBtn.addEventListener("click", stopCamera);
  function stopCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null; video.srcObject = null;
    placeholder.hidden = false;
    openBtn.disabled = false; identifyBtn.disabled = true; stopBtn.disabled = true;
    status.textContent = "Câmera desligada.";
  }

  identifyBtn.addEventListener("click", async () => {
    identifyBtn.disabled = true;
    status.textContent = "Analisando rosto...";
    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceDescriptor();
      if (!detection) { status.textContent = "Rosto não detectado. Ajuste a posição e tente novamente."; return; }
      const response = await fetch("api/pessoas.php");
      const people = await response.json();
      if (!people.length) { status.textContent = "Nenhuma pessoa cadastrada. Faça um cadastro primeiro."; return; }
      const labeled = people.map(p => new faceapi.LabeledFaceDescriptors(p.identificador, [new Float32Array(p.descritor)]));
      const matcher = new faceapi.FaceMatcher(labeled, 0.50);
      const match = matcher.findBestMatch(detection.descriptor);
      const person = people.find(p => p.identificador === match.label);
      sessionStorage.setItem("faceid_resultado", JSON.stringify(
        match.label === "unknown" ? { encontrado: false } : { encontrado: true, pessoa: person }
      ));
      location.href = "aceito.html";
    } catch (error) {
      status.textContent = "Falha na identificação. Verifique a conexão e os modelos faciais.";
      console.error(error);
    } finally {
      identifyBtn.disabled = false;
    }
  });
  window.addEventListener("beforeunload", stopCamera);
})();