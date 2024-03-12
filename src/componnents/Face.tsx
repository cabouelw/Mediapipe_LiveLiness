import { FC, useCallback, useEffect, useState } from "react"
import Webcam from "react-webcam"
import { isBlinking, isHeadTurnLeft, isHeadTurnRight, isSmiling, useFaceDetection } from "../useCamera"

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

const stepData = (currentStep: VerificationStepHumanCheck) => {
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

interface FaceApiProps {
	onSubmit: () => void
	setSelfie: (t: string) => void
	photo: string
}
export enum DistanceVerification {
	CLOSE = -1,
	GOOD = 0,
	FAR = 1,
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

export const FaceApi: FC<FaceApiProps> = ({ photo, setSelfie }) => {
	const [currentStepHumanCheck, setCurrentStepHumanCheck] = useState<VerificationStepHumanCheck>(
		VerificationStepHumanCheck.LOOK_AT_THE_CAMERA
	)
	const { refCanvas, refVideo, setup, handleVideo, faceBlendshapes, distance, predict } = useFaceDetection()
	const isMobileHeight = useMediaQuery("(max-height: 768px)")
	const isMobile = useMediaQuery("(max-width: 768px)") || isMobileHeight
	const isSmallMobile = useMediaQuery("(max-width: 300px)")

	const inputResolution = {
		width: isMobile ? (isSmallMobile ? 210 : 280) : 400,
		height: isMobile ? (isSmallMobile ? 210 : 280) : 400,
	}
	const videoConstraints = {
		width: inputResolution.width,
		height: inputResolution.height,
		facingMode: "user",
	}

	useEffect(() => {
		setup()
		return () => {
			refVideo.current?.video?.removeEventListener("loadeddata", predict)
		}
	}, [])

	const takePicture = useCallback(() => {
		const pictureSrc = refVideo?.current?.getScreenshot()
		if (!pictureSrc || photo.length > 0) return
		setSelfie(pictureSrc)
	}, [refVideo, photo])

	const stepsData = stepData(currentStepHumanCheck)

	const handleGoodDistance = () => {
		switch (currentStepHumanCheck) {
			case VerificationStepHumanCheck.TOO_FAR:
			case VerificationStepHumanCheck.TOO_CLOSE:
				setCurrentStepHumanCheck(VerificationStepHumanCheck.BLINK_BOTH_EYES)
				if (photo.length > 0) setSelfie("")
				break
			case VerificationStepHumanCheck.BLINK_BOTH_EYES:
				if (isBlinking(faceBlendshapes)) {
					setTimeout(() => {
						setCurrentStepHumanCheck(VerificationStepHumanCheck.SMILE)
					}, 50)
				}
				break
			case VerificationStepHumanCheck.SMILE:
				if (isSmiling(faceBlendshapes)) {
					setTimeout(() => {
						setCurrentStepHumanCheck(VerificationStepHumanCheck.TURN_HEAD_LEFT)
					}, 50)
				}
				break
			case VerificationStepHumanCheck.TURN_HEAD_LEFT:
				takePicture()
				if (isHeadTurnLeft(faceBlendshapes)) {
					setTimeout(() => {
						setCurrentStepHumanCheck(VerificationStepHumanCheck.TURN_HEAD_RIGHT)
					}, 50)
				}
				break
			case VerificationStepHumanCheck.TURN_HEAD_RIGHT:
				if (isHeadTurnRight(faceBlendshapes)) {
					setTimeout(() => {
						setCurrentStepHumanCheck(VerificationStepHumanCheck.FIN)
					}, 50)
				}
				break
			default:
				break
		}
	}

	const handleDistanceNotGood = (distance: DistanceVerification) => {
		if (distance === DistanceVerification.CLOSE) {
			setCurrentStepHumanCheck(VerificationStepHumanCheck.TOO_CLOSE)
		} else if (distance === DistanceVerification.FAR) {
			setCurrentStepHumanCheck(VerificationStepHumanCheck.TOO_FAR)
		}
	}

	useEffect(() => {
		if (stepsData.progress === 100) return
		if (!faceBlendshapes.categories.length) {
			setCurrentStepHumanCheck(VerificationStepHumanCheck.LOOK_AT_THE_CAMERA)
			return
		}
		if (
			distance === DistanceVerification.GOOD &&
			currentStepHumanCheck === VerificationStepHumanCheck.LOOK_AT_THE_CAMERA
		)
			setCurrentStepHumanCheck(VerificationStepHumanCheck.BLINK_BOTH_EYES)
		if (distance !== DistanceVerification.GOOD) {
			handleDistanceNotGood(distance)
		} else {
			handleGoodDistance()
		}
	}, [faceBlendshapes])

	return (
		<div className="grid justify-between gap-4 h-full">
			<div className="flex flex-col justify-end h-full min-h-24">
				{stepsData.instruction?.length > 0 ? (
					<div className="mt-auto">
						<p className="text-xl text-red-600 text-center">{stepsData.instruction}</p>
					</div>
				) : (
					currentStepHumanCheck !== VerificationStepHumanCheck.FIN && (
						<div className="text-gray-600">
							<p className="text-xl text-red-500 text-center">keep Device Still</p>
						</div>
					)
				)}
				<p className="text-xl text-blue-600 text-center">
					{stepsData.action} {stepsData.progress}%
				</p>
			</div>
			<div className="grid justify-center  place-items-center relative">
				<div
					className={"relative rounded-full overflow-hidden"}
					style={{
						width: inputResolution.width,
						height: inputResolution.height,
					}}>
					<Webcam
						muted={true}
						ref={refVideo}
						width={inputResolution.width}
						height={inputResolution.height}
						className="absolute top-0 left-0  h-full"
						videoConstraints={videoConstraints}
						mirrored={true}
						
					/>
					<canvas
						ref={refCanvas}
						className="absolute top-0 left-0 opacity-30 object-fill"
						style={{
							transform: "scaleX(-1)",
						}}
						height={inputResolution.height}
						width={inputResolution.width}
					/>
				</div>
			</div>
			<button className="bg-black text-white px-4 py-3 rounded-xl" onClick={handleVideo}>
				Stop/Start
			</button>
		</div>
	)
}
