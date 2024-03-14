import { Classifications, FaceLandmarkerOptions, NormalizedLandmark } from "@mediapipe/tasks-vision"
import { useEffect, useState } from "react"

const EYE_LEFT_CLOSE = 9 // 0-1
const EYE_RIGHT_CLOSE = 10 // 0-1
const FACE_DOWN = [17, 18] // 9.9-0.0
const LOOK_UP = [11, 12] // 1-0
const LOOK_LEFT = [16, 13] // 0-1
const LOOK_RIGHT = [14, 15] // 0-1
const SMILE = [45, 44] // 0-1

// Min and Max face size
export const MIN_FACE_SIZE = 0.3
export const MAX_FACE_SIZE = 0.8

export const OptionsFaceLandmarker: FaceLandmarkerOptions = {
	baseOptions: {
		modelAssetPath: `./face_landmarker.task`,
		delegate: "GPU",
	},
	numFaces: 1,
	runningMode: "VIDEO",
	outputFaceBlendshapes: true,
	outputFacialTransformationMatrixes: true,
}

export const InitFaceBlendshapes = {
	categories: [],
	headIndex: 0,
	headName: "",
}


export enum DistanceVerification {
	CLOSE = -1,
	GOOD = 0,
	FAR = 1,
}

export enum VerificationStepHumanCheck {
	LOOK_AT_THE_CAMERA = "LOOK_AT_THE_CAMERA",
	TOO_CLOSE = "TOO_CLOSE",
	TOO_FAR = "TOO_FAR",
	BLINK_BOTH_EYES = "BLINK_BOTH_EYES",
	SMILE = "SMILE",
	TURN_HEAD_LEFT = "TURN_HEAD_LEFT",
	TURN_HEAD_RIGHT = "TURN_HEAD_RIGHT",
	FIN = "FIN",
}

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

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

export const verifyDistance = (keypoints: NormalizedLandmark[], ismobile: boolean): DistanceVerification => {
	const faceSize = ismobile
		? calculateDistance(keypoints[234].x, keypoints[234].y, keypoints[454].x, keypoints[454].y) + 0.4
		: calculateDistance(keypoints[10].x, keypoints[10].y, keypoints[152].x, keypoints[152].y)

	return faceSize >= MAX_FACE_SIZE
		? DistanceVerification.CLOSE
		: faceSize <= MIN_FACE_SIZE
		? DistanceVerification.FAR
		: DistanceVerification.GOOD
}

export const stepData = (currentStep: VerificationStepHumanCheck) => {
	switch (currentStep) {
		case VerificationStepHumanCheck.LOOK_AT_THE_CAMERA:
			return { action: "", progress: 0, instruction: "look At Camera" }
		case VerificationStepHumanCheck.TOO_CLOSE:
			return { action: "", progress: 0, instruction: "move Further" }
		case VerificationStepHumanCheck.TOO_FAR:
			return { action: "", progress: 0, instruction: "move Closer" }
		case VerificationStepHumanCheck.BLINK_BOTH_EYES:
			return { action: "blink Both Eyes", progress: 20, instruction: "" }
		case VerificationStepHumanCheck.SMILE:
			return { action: "Smile :)", progress: 40, instruction: "" }
		case VerificationStepHumanCheck.TURN_HEAD_LEFT:
			return { action: "turn Head Left", progress: 60, instruction: "" }
		case VerificationStepHumanCheck.TURN_HEAD_RIGHT:
			return { action: "turn Head Right", progress: 80, instruction: "" }
		case VerificationStepHumanCheck.FIN:
			return { action: "done", progress: 100, instruction: "" }
		default:
			return { action: "", progress: 0, instruction: "" }
	}
}

export const useMediaQuery = (query: string): boolean => {
	const [matches, setMatches] = useState<boolean>(false)

	useEffect(() => {
		const media = window.matchMedia(query)
		if (media.matches !== matches) {
			setMatches(media.matches)
		}
		const listener = () => setMatches(media.matches)
		media.addListener(listener)
		return () => media.removeListener(listener)
	}, [matches, query])

	return matches
}