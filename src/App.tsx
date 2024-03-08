import "./App.css"
import { useEffect } from "react"
import { useFaceDetection } from "./useCamera"

function App() {
	const { setup, refVideo, setStop, msg } = useFaceDetection()
	useEffect(() => {
		setup()
	}, [])

	return (
		<div className="w-full h-full flex flex-col justify-center items-center">
			<video ref={refVideo} className="w-[400px]" width={300} id="video" autoPlay />
			<button type="button" onClick={() => setStop((prev) => !prev)}>
				Pause
			</button>
			<p>{msg}</p>
		</div>
	)
}

export default App
