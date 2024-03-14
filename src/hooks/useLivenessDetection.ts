import {
	Classifications,
	FaceLandmarker,
	FilesetResolver,
	NormalizedLandmark,
} from "@mediapipe/tasks-vision"
import { useRef, useState } from "react"
import Webcam from "react-webcam"
import { DrawingUtils } from "@mediapipe/tasks-vision"
import { InitFaceBlendshapes, OptionsFaceLandmarker, useMediaQuery, verifyDistance } from "../utils/config"

let videoTarget: Webcam
let faceLandmarker: FaceLandmarker
let lastVideoTime = -1

export const useLivenessDetection = () => {
	const refCanvas = useRef<HTMLCanvasElement>(null)
	const refVideo = useRef<Webcam>(null)
	const [mystream, setMystream] = useState<MediaStream | null>(null)
	const [faceBlendshapes, setFaceBlendshapes] = useState<Classifications>(InitFaceBlendshapes)
	const isMobile = useMediaQuery("(max-width: 768px)")
	const [distance, setDistance] = useState(0)

	const setup = async () => {
		const filesetResolver = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
		)
		faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, OptionsFaceLandmarker)

		videoTarget = refVideo.current as Webcam
		navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: {
					aspectRatio: { ideal: 1 },
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

	const DrawFaceMesh = (
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
				setFaceBlendshapes(InitFaceBlendshapes)
			} else if (
				faceLandmarkerResult.faceBlendshapes &&
				faceLandmarkerResult.faceBlendshapes.length > 0 &&
				faceLandmarkerResult.faceBlendshapes[0].categories
			) {
				const canvasCtx = refCanvas.current!.getContext("2d") as CanvasRenderingContext2D
				const drawingUtils = new DrawingUtils(canvasCtx)
				const dist = verifyDistance(faceLandmarkerResult.faceLandmarks[0], isMobile)
				setDistance(dist)
				setFaceBlendshapes(faceLandmarkerResult.faceBlendshapes[0])
				DrawFaceMesh(faceLandmarkerResult.faceLandmarks, drawingUtils, canvasCtx)
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
