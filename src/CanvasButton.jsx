const CanvasButton = ({ onCanvasCreate }) => {

    const createCanvas = () => {
        const canvas = document.createElement('canvas')
        canvas.className = 'new-canvas'
        onCanvasCreate(canvas)
    }

    return (
        <div>
            <button onClick={createCanvas}>Create Canvas</button>
        </div>
    )
}

export default CanvasButton
