import "./App.css"
import { useEffect } from "react"
import { useFaceDetection } from "./useCamera"

function App() {
	const { setup, refVideo, setStop, msg } = useFaceDetection()
	useEffect(() => {
		setup()
	}, [])

	return (
		<div className="App">
			<video ref={refVideo} className="camera-feed" id="video" autoPlay  />
			<button type="button" onClick={() => setStop((prev) => !prev)}>
				Pause
			</button>
			<p>{msg}</p>
		</div>
	)
}

export default App
