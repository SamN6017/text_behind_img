import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import "./BgRemover.css"; // Import the CSS file

const ImgInput = () => {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [textInput, setTextInput] = useState("");
    const [textColor, setTextColor] = useState("#ffffff");
    const [textHeight, setTextHeight] = useState(50);
    const [textXPosition, setTextXPosition] = useState(200);
    const [textSize, setTextSize] = useState(30);
    const [font, setFont] = useState("Arial");
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef(null);

    const { getRootProps, getInputProps } = useDropzone({
        accept: "image/*",
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            setOriginalImage(URL.createObjectURL(file));

            // Reset all settings when a new image is uploaded
            setProcessedImage(null);
            setTextInput("");
            setTextColor("#ffffff");
            setTextHeight(50);
            setTextXPosition(200);
            setTextSize(30);
            setFont("Arial");
            setRotation(0);
        },
    });


    const handleBackgroundRemoval = async () => {
        if (!originalImage) {
            alert("Please upload a background image first.");
            return;
        }

        setLoading(true);
        const file = await fetch(originalImage).then((res) => res.blob());
        const formData = new FormData();
        formData.append("image_file", file);

        try {
            const response = await axios.post(
                "https://api.remove.bg/v1.0/removebg",
                formData,
                {
                    headers: {
                        "X-Api-Key": process.env.REACT_APP_REMOVE_BG_API_KEY,
                    },
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], { type: "image/png" });
            setProcessedImage(URL.createObjectURL(blob));
        } catch (error) {
            console.error("Error removing background:", error);
        } finally {
            setLoading(false);
        }
    };

    const drawCanvas = () => {
        if (!originalImage || !processedImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const background = new Image();
        const foreground = new Image();

        background.src = originalImage;
        foreground.src = processedImage;

        Promise.all([
            new Promise((resolve) => (background.onload = resolve)),
            new Promise((resolve) => (foreground.onload = resolve)),
        ]).then(() => {
            const scale = Math.min(800 / background.width, 800 / background.height, 1);

            canvas.width = background.width * scale;
            canvas.height = background.height * scale;

            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(textXPosition, textHeight);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.font = `${textSize}px ${font}`;
            ctx.fillStyle = textColor;
            ctx.textAlign = "center";
            ctx.fillText(textInput, 0, 0);
            ctx.restore();

            ctx.drawImage(
                foreground,
                0,
                0,
                canvas.width,
                canvas.height
            );
        });
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const imageURL = canvas.toDataURL("image/png"); // Convert canvas content to image
            const link = document.createElement("a");
            link.href = imageURL;
            link.download = "output-image.png"; // Set the file name for the download
            link.click();
        } else {
            alert("No image to download. Please process an image first.");
        }
    };


    useEffect(() => {
        drawCanvas();
    }, [textInput, textColor, textHeight, textXPosition, textSize, font, rotation, originalImage, processedImage]);

    return (
        <div className="container">
            <div className="upload-section">
                <div {...getRootProps({ className: "dropzone" })}>
                    <input {...getInputProps()} />
                    <p>Drag & drop an image here, or click to upload</p>
                </div>
                <button className="upload-button" onClick={handleBackgroundRemoval}>
                    Remove Background
                </button>
            </div>

            <div className="main-section">
                <div className="canvas-container">
                    <canvas ref={canvasRef} />
                </div>

                <div className="controls-container">
                    <div className="text-settings">
                        <input
                            type="text"
                            placeholder="Enter text here"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                        <div className="text-row">
                            <label>
                                Color:{" "}
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                />
                            </label>
                            <label>
                                Font:{" "}
                                <select value={font} onChange={(e) => setFont(e.target.value)}>
                                    <option value="Arial">Arial</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Georgia">Georgia</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="sliders-container">
                        <div className="slider-card">
                            <label>X Position: {textXPosition}px</label>
                            <input
                                type="range"
                                min="0"
                                max="800"
                                value={textXPosition}
                                onChange={(e) => setTextXPosition(Number(e.target.value))}
                            />
                        </div>
                        <div className="slider-card">
                            <label>Y Position: {textHeight}px</label>
                            <input
                                type="range"
                                min="0"
                                max="800"
                                value={textHeight}
                                onChange={(e) => setTextHeight(Number(e.target.value))}
                            />
                        </div>
                        <div className="slider-card">
                            <label>Text Size: {textSize}px</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={textSize}
                                onChange={(e) => setTextSize(Number(e.target.value))}
                            />
                        </div>
                        <div className="slider-card">
                            <label>Rotation: {rotation}°</label>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: "20px" }}>
                <button
                    onClick={() => handleDownload()}
                    className="download-button"
                >
                    Download Image
                </button>
            </div>

        </div>
    );
};

export default ImgInput;
