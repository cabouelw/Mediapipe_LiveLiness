import { FaceLandmarker, FaceLandmarkerOptions, FilesetResolver } from "@mediapipe/tasks-vision"
import { useCallback, useEffect, useRef, useState } from "react"

interface blendshapesType {
	index: number
	score: number
	categoryName: string
	displayName: string
}
let video: HTMLVideoElement
let faceLandmarker: FaceLandmarker
let lastVideoTime = -1
let blendshapes: blendshapesType[] = []

const EYE_LEFT_CLOSE = 9 // 0-1
const EYE_RIGHT_CLOSE = 10 // 0-1
const FACE_DOWN = [17, 18] // 9.9-0.0
const LOOK_UP = [11, 12] // 1-0
const LOOK_LEFT = [16, 13] // 0-1
const LOOK_RIGHT = [14, 15] // 0-1
const SMILE = [45, 44] // 0-1

const options: FaceLandmarkerOptions = {
	baseOptions: {
		modelAssetPath: `./face_landmarker.task`,
		delegate: "CPU",
	},
	numFaces: 1,
	runningMode: "VIDEO",
	outputFaceBlendshapes: true,
	outputFacialTransformationMatrixes: true,
}
export const useFaceDetection = () => {
	const refVideo = useRef<HTMLVideoElement>(null)
	const [stop, setStop] = useState(true)
	const [msg, setMsg] = useState("Hello World!")
	const setup = async () => {
		const filesetResolver = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
		)
		faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, options)

		video = refVideo.current as HTMLVideoElement
		navigator.mediaDevices
			.getUserMedia({
				video: { width: 1280, height: 720 },
				audio: false,
			})
			.then(function (stream) {
				video.srcObject = stream
				video.addEventListener("loadeddata", predict)
			})
	}

	const predict = useCallback(async () => {
		let nowInMs = Date.now()
		if (lastVideoTime !== video.currentTime) {
			setMsg("start")
			lastVideoTime = video.currentTime
			const faceLandmarkerResult = faceLandmarker.detectForVideo(video, nowInMs)

			if (
				faceLandmarkerResult.faceBlendshapes &&
				faceLandmarkerResult.faceBlendshapes.length > 0 &&
				faceLandmarkerResult.faceBlendshapes[0].categories
			) {
				blendshapes = faceLandmarkerResult.faceBlendshapes[0].categories
				if (blendshapes[EYE_LEFT_CLOSE].score > 0.5) {
					setMsg("EYE LEFT Blink")
				} else if (blendshapes[EYE_RIGHT_CLOSE].score > 0.5) {
					setMsg("EYE RIGHT Blink")
				} else if (blendshapes[FACE_DOWN[0]].score > 0.5 && blendshapes[FACE_DOWN[1]].score > 0.5) {
					setMsg("FACE DOWN")
				} else if (blendshapes[LOOK_UP[0]].score > 0.6 && blendshapes[LOOK_UP[1]].score > 0.6) {
					setMsg("LOOK UP")
				} else if (blendshapes[LOOK_RIGHT[0]].score > 0.6 && blendshapes[LOOK_RIGHT[1]].score > 0.6) {
					setMsg("LOOK RIGHT")
				} else if (blendshapes[LOOK_LEFT[0]].score > 0.6 && blendshapes[LOOK_LEFT[1]].score > 0.6) {
					setMsg("LOOK LEFT")
				} else if (blendshapes[SMILE[0]].score > 0.6 && blendshapes[SMILE[1]].score > 0.6) {
					setMsg("SMILE")
				}
			}
		}
		if (!stop) window.requestAnimationFrame(predict)
	}, [stop])

	useEffect(() => {
		if (!video) return
		if (stop) {
			video.removeEventListener("loadeddata", predict)
			video.pause()
		} else {
			video.addEventListener("loadeddata", predict)
			video.play()
		}
		return () => {
			video.removeEventListener("loadeddata", predict)
		}
	}, [stop])
	return {
		setup,
		refVideo,
		setStop,
		msg,
	}
}
