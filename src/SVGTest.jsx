
import {useRef} from "react";

function SVGTest ({ base64Url }){
    const svgRef = useRef(null)
    const containerRef = useRef(null)

    function populateSVG (){
        svgRef.current.style.backgroundImage = `url(data:image/png;base64,${base64Url})`
    }

    function zoomIn(){
        const prevWidth = parseInt(svgRef.current.clientWidth )
        console.log(prevWidth)
        svgRef.current.setAttribute('width', prevWidth * 2)
    }

    function zoomOut(){
        // Prevents SVG element from getting smaller than the container
        if (containerRef.current.clientWidth >= svgRef.current.clientWidth){
            return
        }

        const prevWidth = parseInt(svgRef.current.clientWidth )
        svgRef.current.setAttribute('width', prevWidth / 2)
    }

    function drawLine(x){
        console.log('drawing line')
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')

        line.setAttribute('x1', x)
        line.setAttribute('y1', 0)
        line.setAttribute('x2', x)
        line.setAttribute('y2', 256)
        line.setAttribute('stroke', '#00FF00')
        line.setAttribute('stroke-width', '2')

        svgRef.current.appendChild(line)
    }

    function getXClicked(event){
        const rect = event.target.getBoundingClientRect()
        return event.clientX - rect.left
    }

    function handleLMBDown(event){
        // Ignore other mouse buttons
        if (event.button !== 0){
            return
        }

        const xClicked = getXClicked(event)

        drawLine(xClicked)
    }

    function deleteLines(){
        const lastChild = svgRef.current.lastElementChild
        if (!lastChild){
            return
        }
        svgRef.current.removeChild(lastChild)
    }

    return (
        <>
            <div
                id='svg-container'
                ref={containerRef}
            >
                <svg width='100%'
                     id='test-svg'
                     ref={svgRef}
                     onMouseDown={handleLMBDown}
                >
                </svg>
            </div>
            <button onClick={populateSVG}>
                Populate
            </button>
            <button onClick={zoomIn}>
                Zoom in
            </button>
            <button onClick={zoomOut}>
                Zoom out
            </button>
            <button onClick={deleteLines}>
                Delete Lines
            </button>
        </>

    )
}

export default SVGTest