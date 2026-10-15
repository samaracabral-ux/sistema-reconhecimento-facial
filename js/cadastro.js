
(() => {
    const video = document.getElementById("videoCadastro");
    const status = document.getElementById("cadStatus");
    const start = document.getElementById("iniciarCadastro");
    const capture = document.getElementById("capturar");
    const placeholder = document.getElementById("cadPlaceholder");
    const form = document.getElementById("cadastroForm");

    let stream = null;
    let faceDescriptor = null;
    let facePhoto = null;
    let modelsReady = false;

    function showStatus(message) {
        status.textContent = message;
    }

    async function loadModels() {
        if (modelsReady) return;

        if (typeof faceapi === "undefined") {
            throw new Error("A biblioteca face-api.js não foi carregada.");
        }

        const modelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

        showStatus("Carregando modelos de reconhecimento...");

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
        ]);

        modelsReady = true;
    }

    start.addEventListener("click", async () => {
        start.disabled = true;

        try {
            await loadModels();

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user"
                },
                audio: false
            });

            video.srcObject = stream;

            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = () => reject(
                    new Error("Não foi possível carregar o vídeo.")
                );
            });

            await video.play();

            placeholder.hidden = true;
            capture.disabled = false;

            showStatus("Câmera ativa. Posicione o rosto e capture.");

        } catch (error) {
            start.disabled = false;
            showStatus("Erro ao iniciar: " + error.message);
            console.error(error);
        }
    });

    capture.addEventListener("click", async () => {
        if (!video.videoWidth || !video.videoHeight) {
            showStatus("Aguarde a câmera iniciar.");
            return;
        }

        capture.disabled = true;

        try {
            showStatus("Detectando rosto...");

            const result = await faceapi
                .detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5
                    })
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!result) {
                showStatus("Nenhum rosto detectado. Tente novamente.");
                return;
            }

            faceDescriptor = Array.from(result.descriptor);

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext("2d");
            context.drawImage(video, 0, 0);

            facePhoto = canvas.toDataURL("image/jpeg", 0.82);

            showStatus("Rosto capturado. Agora salve o cadastro.");

        } catch (error) {
            showStatus("Erro na captura: " + error.message);
            console.error(error);
        } finally {
            capture.disabled = false;
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!faceDescriptor || !facePhoto) {
            showStatus("Capture o rosto antes de salvar.");
            return;
        }

        const payload = {
            nome: document.getElementById("nome").value.trim(),
            identificador: document.getElementById("identificador").value.trim(),
            setor: document.getElementById("setor").value.trim(),
            cargo: document.getElementById("cargo").value.trim(),
            foto: facePhoto,
            descritor: faceDescriptor
        };

        if (!payload.nome || !payload.identificador) {
            showStatus("Preencha o nome e o identificador.");
            return;
        }

        const saveButton = form.querySelector('[type="submit"]');
        if (saveButton) saveButton.disabled = true;

        try {
            showStatus("Salvando cadastro...");

          const response = await fetch("api/pessoas.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        "O servidor retornou uma resposta inválida."
                    );
                }
            }

            if (!response.ok) {
                throw new Error(
                    data.erro || "Erro ao salvar cadastro."
                );
            }

            showStatus("Cadastro salvo com sucesso!");

            form.reset();
            faceDescriptor = null;
            facePhoto = null;

        } catch (error) {
            showStatus(error.message);
            console.error(error);
        } finally {
            if (saveButton) saveButton.disabled = false;
        }
    });

    window.addEventListener("beforeunload", () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
})();
