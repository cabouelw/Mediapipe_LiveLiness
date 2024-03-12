import {
	Classifications,
	FaceLandmarker,
	FaceLandmarkerOptions,
	FilesetResolver,
	NormalizedLandmark,
} from "@mediapipe/tasks-vision"
import { useRef, useState } from "react"
import Webcam from "react-webcam"
import { DrawingUtils } from "@mediapipe/tasks-vision"
import { DistanceVerification, useMediaQuery } from "./componnents/Face"

let videoTarget: Webcam
let faceLandmarker: FaceLandmarker
let lastVideoTime = -1

const EYE_LEFT_CLOSE = 9 // 0-1
const EYE_RIGHT_CLOSE = 10 // 0-1
const FACE_DOWN = [17, 18] // 9.9-0.0
const LOOK_UP = [11, 12] // 1-0
const LOOK_LEFT = [16, 13] // 0-1
const LOOK_RIGHT = [14, 15] // 0-1
const SMILE = [45, 44] // 0-1

export const isBlinking = (faceBlendshapes: Classifications) => {
	return (
		faceBlendshapes.categories[EYE_LEFT_CLOSE].score > 0.5 &&
		faceBlendshapes.categories[EYE_RIGHT_CLOSE].score > 0.5
	)
}

export const isHeadTurnLeft = (faceBlendshapes: Classifications) => {
	return (
		faceBlendshapes.categories[LOOK_LEFT[0]].score > 0.5 &&
		faceBlendshapes.categories[LOOK_LEFT[1]].score > 0.5 &&
		faceBlendshapes.categories[LOOK_RIGHT[0]].score < 0.5 &&
		faceBlendshapes.categories[LOOK_RIGHT[1]].score < 0.5
	)
}
export const isHeadTurnRight = (faceBlendshapes: Classifications) => {
	return (
		faceBlendshapes.categories[LOOK_RIGHT[0]].score > 0.5 &&
		faceBlendshapes.categories[LOOK_RIGHT[1]].score > 0.5 &&
		faceBlendshapes.categories[LOOK_LEFT[0]].score < 0.5 &&
		faceBlendshapes.categories[LOOK_LEFT[1]].score < 0.5
	)
}

export const isSmiling = (faceBlendshapes: Classifications) => {
	return faceBlendshapes.categories[SMILE[0]].score > 0.5 && faceBlendshapes.categories[SMILE[1]].score > 0.5
}

export const isFaceDown = (faceBlendshapes: Classifications) => {
	return (
		faceBlendshapes.categories[FACE_DOWN[0]].score > 0.5 &&
		faceBlendshapes.categories[FACE_DOWN[1]].score > 0.5 &&
		faceBlendshapes.categories[LOOK_UP[0]].score < 0.5 &&
		faceBlendshapes.categories[LOOK_UP[1]].score < 0.5
	)
}

export const isFaceUp = (faceBlendshapes: Classifications) => {
	return (
		faceBlendshapes.categories[LOOK_UP[0]].score > 0.5 &&
		faceBlendshapes.categories[LOOK_UP[1]].score > 0.5 &&
		faceBlendshapes.categories[FACE_DOWN[0]].score < 0.5 &&
		faceBlendshapes.categories[FACE_DOWN[1]].score < 0.5
	)
}

const options: FaceLandmarkerOptions = {
	baseOptions: {
		modelAssetPath: `./face_landmarker.task`,
		delegate: "GPU",
	},
	numFaces: 1,
	runningMode: "VIDEO",
	outputFaceBlendshapes: true,
	outputFacialTransformationMatrixes: true,
}

const init = {
	categories: [],
	headIndex: 0,
	headName: "",
}

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

// Min and Max face size
export const MIN_FACE_SIZE = 0.35
export const MAX_FACE_SIZE = 0.8

export const verifyDistance = (keypoints: NormalizedLandmark[], ismobile: boolean): DistanceVerification => {
	const faceSize = ismobile
		? calculateDistance(keypoints[234].x, keypoints[234].y, keypoints[454].x, keypoints[454].y)
		: calculateDistance(keypoints[10].x, keypoints[10].y, keypoints[152].x, keypoints[152].y)

	return faceSize >= MAX_FACE_SIZE
		? DistanceVerification.CLOSE
		: faceSize <= MIN_FACE_SIZE
		? DistanceVerification.FAR
		: DistanceVerification.GOOD
}

export const useFaceDetection = () => {
	const refCanvas = useRef<HTMLCanvasElement>(null)
	const refVideo = useRef<Webcam>(null)
	const [mystream, setMystream] = useState<MediaStream | null>(null)
	const [faceBlendshapes, setFaceBlendshapes] = useState<Classifications>(init)
	const isMobileHeight = useMediaQuery("(max-height: 768px)")
	const isMobile = useMediaQuery("(max-width: 768px)") || isMobileHeight
	const [distance, setDistance] = useState(0)
	const setup = async () => {
		const filesetResolver = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
		)
		faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, options)

		videoTarget = refVideo.current as Webcam
		navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: {
					width: 1280,
					height: 720,
					facingMode: "user",
				},
			})
			.then(function (stream) {
				videoTarget.video!.srcObject = stream
				setMystream(stream)
				try {
					videoTarget.video!.addEventListener("loadeddata", predict)
				} catch (e) {
					alert(e)
				}
			})
	}

	const handleVideo = () => {
		mystream?.getTracks().forEach((track) => {
			if (track.readyState === "live" && track.kind === "video") {
				track.enabled = !track.enabled ? true : false
			}
		})
	}

	const DrawMesh = (
		faceLandmarks: NormalizedLandmark[][],
		drawingUtils: DrawingUtils,
		ctx: CanvasRenderingContext2D
	) => {
		if (faceLandmarks && drawingUtils) {
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

			for (const landmarks of faceLandmarks) {
				drawingUtils!.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
					color: "#C0C0C0",
					lineWidth: 1,
				})
			}
		}
	}

	const predict = async () => {
		let nowInMs = Date.now()
		if (refVideo.current && lastVideoTime !== refVideo.current.video?.currentTime) {
			lastVideoTime = refVideo.current.video!.currentTime
			const faceLandmarkerResult = faceLandmarker.detectForVideo(refVideo.current.video!, nowInMs)
			if (!faceLandmarkerResult.faceLandmarks.length) {
				setDistance(0)
				setFaceBlendshapes(init)
			}
			else if (
				faceLandmarkerResult.faceBlendshapes &&
				faceLandmarkerResult.faceBlendshapes.length > 0 &&
				faceLandmarkerResult.faceBlendshapes[0].categories
			) {
				const canvasCtx = refCanvas.current!.getContext("2d") as CanvasRenderingContext2D
				const drawingUtils = new DrawingUtils(canvasCtx)
				const dist = verifyDistance(faceLandmarkerResult.faceLandmarks[0], isMobile)
				setDistance(dist)
				setFaceBlendshapes(faceLandmarkerResult.faceBlendshapes[0])
				DrawMesh(faceLandmarkerResult.faceLandmarks, drawingUtils, canvasCtx)
			}
		}
		window.requestAnimationFrame(predict)
	}

	return {
		setup,
		refVideo,
		predict,
		refCanvas,
		faceBlendshapes,
		distance,
		handleVideo,
	}
}
