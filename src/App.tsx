import "./App.css"
import { useEffect } from "react"
import { useFaceDetection } from "./useCamera"
import Webcam from "react-webcam"

function App() {
	const { setup, refVideo, setStop, msg } = useFaceDetection()
	useEffect(() => {
		setup()
	}, [])

	return (
		<div className="w-full h-full flex flex-col justify-center items-center">
			<Webcam ref={refVideo} className="w-full" width={300} id="video" autoPlay />
			<button type="button" onClick={() => setStop((prev) => !prev)}>
				Pause
			</button>
			<p>{msg}</p>
		</div>
	)
}

export default App
