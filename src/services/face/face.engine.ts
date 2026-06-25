import fs from "fs";
import path from "path";

export interface FaceEngine {
  /** Extrai o descritor (vetor 128-d) de um rosto; null se nenhum rosto. */
  computeDescriptor(image: Buffer): Promise<number[] | null>;
  /** Distância euclidiana entre dois descritores (menor = mais parecido). */
  distance(a: number[], b: number[]): number;
}

// carrega libs pesadas sob demanda; o specifier não-literal evita que o
// TypeScript exija as dependências quando o reconhecimento está desativado.
const loadModule = (name: string): Promise<any> => import(name);

/**
 * Engine baseada em @vladmandic/face-api + @tensorflow/tfjs + canvas.
 * Os modelos (weights) são carregados de FACE_MODELS_DIR (padrão ./models/face):
 *   ssdMobilenetv1, faceLandmark68Net, faceRecognitionNet.
 */
export class FaceApiEngine implements FaceEngine {
  private ready?: Promise<void>;
  private faceapi: any;
  private canvas: any;

  private init(): Promise<void> {
    if (this.ready) {
      return this.ready;
    }

    this.ready = (async () => {
      let tfReady: any;
      let faceapi: any;
      let canvas: any;

      try {
        await loadModule("@tensorflow/tfjs");
        faceapi = await loadModule("@vladmandic/face-api");
        canvas = await loadModule("canvas");
      } catch (error) {
        throw new Error(
          "Dependências de reconhecimento facial ausentes. Instale: " +
            "@tensorflow/tfjs @vladmandic/face-api canvas. Detalhe: " +
            (error instanceof Error ? error.message : String(error)),
        );
      }

      faceapi.env.monkeyPatch({
        Canvas: canvas.Canvas,
        Image: canvas.Image,
        ImageData: canvas.ImageData,
      });

      const modelsDir =
        process.env.FACE_MODELS_DIR ??
        path.join(process.cwd(), "models", "face");

      if (!fs.existsSync(modelsDir)) {
        throw new Error(
          `Modelos do face-api não encontrados em "${modelsDir}". ` +
            "Baixe os weights (ssdMobilenetv1, faceLandmark68Net, " +
            "faceRecognitionNet) e ajuste FACE_MODELS_DIR.",
        );
      }

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsDir);

      this.faceapi = faceapi;
      this.canvas = canvas;
      void tfReady;
    })();

    return this.ready;
  }

  async computeDescriptor(image: Buffer): Promise<number[] | null> {
    await this.init();

    const img = await this.canvas.loadImage(image);

    const detection = await this.faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return Array.from(detection.descriptor as Float32Array);
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
