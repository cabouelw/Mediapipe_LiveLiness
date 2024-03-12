import "./App.css"
import { useState } from "react"
import { useMediaQuery } from "./componnents/Face"
import Webcam from "react-webcam"

function App() {
	// const [photo, setPhoto] = useState<string>("")
	const [show, setShow] = useState<boolean>(false)
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
		facingMode: show ? "user" : "environment",
	}

	return (
		<div className="w-full h-full flex flex-col justify-center items-center">
			{/* {show ? ( */}
			<Webcam
				muted={true}
				width={inputResolution.width}
				height={inputResolution.height}
				className="object-fill"
				videoConstraints={videoConstraints}
				mirrored={true}
			/>
			{/* // ) : ( */}
			{/* // 	<FaceApi photo={photo} setSelfie={setPhoto} onSubmit={() => {}} />
			// )} */}
			<button onClick={() => setShow((prev) => !prev)} className="bg-white text-black px-4 py-3 rounded-xl">
				Switch
			</button>
		</div>
	)
}

export default App
