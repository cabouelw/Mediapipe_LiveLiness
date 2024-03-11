import "./App.css"
import { useEffect, useState } from "react"
import { useFaceDetection } from "./useCamera"
import Webcam from "react-webcam"
import { FaceApi } from "./componnents/Face"

function App() {
	// const { setup, refVideo, setStop, msg, refCanvas } = useFaceDetection()
	// useEffect(() => {
	// 	setup()
	// }, [])
	const [photo, setPhoto] = useState<string>("")

	return (
		<div className="w-full h-full flex flex-col justify-center items-center">
			<FaceApi  photo={photo} setSelfie={setPhoto} onSubmit={() => {}} />
		</div>
	)
}

export default App
