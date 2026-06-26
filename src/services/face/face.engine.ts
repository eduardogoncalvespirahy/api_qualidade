import fs from "fs";
import path from "path";

export interface FaceEngine {
  /** Extrai o descritor (vetor 128-d) de um rosto; null se nenhum rosto. */
  computeDescriptor(image: Buffer): Promise<number[] | null>;
  /** Distância euclidiana entre dois descritores (menor = mais parecido). */
  distance(a: number[], b: number[]): number;
}

// carrega libs sob demanda; specifier não-literal evita exigir as deps no build
const loadModule = (name: string): Promise<any> => import(name);

/**
 * Engine de reconhecimento facial 100% JavaScript — SEM dependências nativas
 * (não usa @tensorflow/tfjs-node nem canvas, que falham ao compilar no Windows).
 *
 *  - Inferência: @vladmandic/face-api no build CPU (tfjs embutido).
 *  - Decodificação de imagem: jimp (puro JS) -> tensor.
 *
 * Modelos (weights) em FACE_MODELS_DIR (padrão ./models/face):
 *   tiny_face_detector, face_landmark_68, face_recognition.
 */
export class FaceApiEngine implements FaceEngine {
  private ready?: Promise<void>;
  private faceapi: any;
  private Jimp: any;
  private detectorOptions: any;

  private init(): Promise<void> {
    if (this.ready) {
      return this.ready;
    }

    this.ready = (async () => {
      let faceapi: any;
      let jimpMod: any;

      try {
        // build CPU do face-api (tfjs puro-JS embutido, sem binário nativo)
        faceapi = await loadModule("@vladmandic/face-api/dist/face-api.node-cpu.js");
        jimpMod = await loadModule("jimp");
      } catch (error) {
        throw new Error(
          "Dependências de reconhecimento facial ausentes. Instale: " +
            "@vladmandic/face-api jimp. Detalhe: " +
            (error instanceof Error ? error.message : String(error)),
        );
      }

      this.Jimp = jimpMod.Jimp ?? jimpMod.default ?? jimpMod;

      await faceapi.tf.setBackend("cpu");
      await faceapi.tf.ready();

      const modelsDir =
        process.env.FACE_MODELS_DIR ??
        path.join(process.cwd(), "models", "face");

      if (!fs.existsSync(modelsDir)) {
        throw new Error(
          `Modelos do face-api não encontrados em "${modelsDir}". ` +
            "Baixe os weights (tiny_face_detector, face_landmark_68, " +
            "face_recognition) e ajuste FACE_MODELS_DIR.",
        );
      }

      await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsDir);

      this.faceapi = faceapi;
      this.detectorOptions = new faceapi.TinyFaceDetectorOptions();
    })();

    return this.ready;
  }

  async computeDescriptor(image: Buffer): Promise<number[] | null> {
    await this.init();

    // decodifica a imagem (JPEG/PNG/...) para pixels RGBA com Jimp
    const decoded = await this.Jimp.read(image);
    const { data, width, height } = decoded.bitmap as {
      data: Buffer;
      width: number;
      height: number;
    };

    // RGBA -> RGB
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgb[j] = data[i];
      rgb[j + 1] = data[i + 1];
      rgb[j + 2] = data[i + 2];
    }

    const tf = this.faceapi.tf;
    const input = tf.tensor3d(rgb, [height, width, 3], "int32");

    try {
      const detection = await this.faceapi
        .detectSingleFace(input, this.detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }
      return Array.from(detection.descriptor as Float32Array);
    } finally {
      input.dispose();
    }
  }

  distance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return Number.POSITIVE_INFINITY;
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}
