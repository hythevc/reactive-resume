"use client";

import {
	Camera,
	Check,
	Download,
	ImagePlus,
	RotateCcw,
	ShieldCheck,
	SlidersHorizontal,
	Trash2,
	Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type Preset = "natural" | "studio" | "warm" | "cool" | "monochrome";
const OUTPUT_SIZE = 1024;
const MAX_FILE_SIZE = 12 * 1024 * 1024;
const presets: {
	id: Preset;
	label: string;
	filter: string;
	description: string;
}[] = [
	{
		id: "natural",
		label: "Natural",
		filter: "",
		description: "Original color",
	},
	{
		id: "studio",
		label: "Studio",
		filter: "contrast(1.06) saturate(0.92)",
		description: "Crisp and balanced",
	},
	{
		id: "warm",
		label: "Warm",
		filter: "sepia(0.16) saturate(1.08) contrast(1.02)",
		description: "A softer tone",
	},
	{
		id: "cool",
		label: "Cool",
		filter: "saturate(0.85) hue-rotate(10deg) contrast(1.03)",
		description: "Clean and understated",
	},
	{
		id: "monochrome",
		label: "Black & white",
		filter: "grayscale(1) contrast(1.08)",
		description: "Timeless contrast",
	},
];

type AdjustmentProps = {
	id: string;
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	display: string;
	disabled: boolean;
	onChange: (value: number) => void;
};

function Adjustment({ id, label, value, min, max, step = 1, display, disabled, onChange }: AdjustmentProps) {
	return (
		<label className="field" htmlFor={id}>
			<span>
				{label}
				<small className="muted" style={{ float: "right" }}>
					{display}
				</small>
			</span>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(Number(event.target.value))}
				style={{ width: "100%", accentColor: "#173f35" }}
			/>
		</label>
	);
}

export function PhotoView() {
	const inputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const originalCanvasRef = useRef<HTMLCanvasElement>(null);
	const sourceUrlRef = useRef<string | null>(null);
	const uploadSequence = useRef(0);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const [fileName, setFileName] = useState("profile-photo");
	const [preset, setPreset] = useState<Preset>("natural");
	const [zoom, setZoom] = useState(1);
	const [focalX, setFocalX] = useState(0);
	const [focalY, setFocalY] = useState(0);
	const [exposure, setExposure] = useState(100);
	const [loading, setLoading] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [downloaded, setDownloaded] = useState(false);
	const [comparison, setComparison] = useState<"original" | "edited">("edited");
	const [previewShape, setPreviewShape] = useState<"square" | "circle">("square");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	useEffect(
		() => () => {
			uploadSequence.current += 1;
			if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
		},
		[],
	);

	useEffect(() => {
		if (!image || !canvasRef.current || !originalCanvasRef.current) return;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");
		const original = originalCanvasRef.current.getContext("2d");
		if (!context || !original) {
			setError("Photo editing is unavailable in this browser. Try a current Chrome, Firefox, or Safari browser.");
			return;
		}
		const scale = Math.max(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight) * zoom;
		const width = image.naturalWidth * scale;
		const height = image.naturalHeight * scale;
		const left = -(width - OUTPUT_SIZE) * ((focalX + 100) / 200);
		const top = -(height - OUTPUT_SIZE) * ((focalY + 100) / 200);
		context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = "high";
		const finish = presets.find((item) => item.id === preset)?.filter || "";
		context.filter = `${exposure === 100 ? "" : `brightness(${exposure}%)`} ${finish}`.trim() || "none";
		context.drawImage(image, left, top, width, height);
		context.filter = "none";
		original.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
		original.imageSmoothingEnabled = true;
		original.imageSmoothingQuality = "high";
		original.filter = "none";
		original.drawImage(image, left, top, width, height);
		setDownloaded(false);
		setMessage((current) => (current.startsWith("Your 1,024") ? "" : current));
	}, [image, preset, zoom, focalX, focalY, exposure]);

	function resetAdjustments() {
		setPreset("natural");
		setZoom(1);
		setFocalX(0);
		setFocalY(0);
		setExposure(100);
		setDownloaded(false);
		setMessage("");
	}

	async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		setError("");
		setMessage("");
		if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
			setError("Choose a JPG, PNG, or WebP image.");
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			setError("Choose a photo smaller than 12 MB.");
			return;
		}
		const sequence = ++uploadSequence.current;
		const objectUrl = URL.createObjectURL(file);
		setLoading(true);
		try {
			const decoded = new Image();
			decoded.src = objectUrl;
			await decoded.decode();
			if (sequence !== uploadSequence.current) {
				URL.revokeObjectURL(objectUrl);
				return;
			}
			if (
				!decoded.naturalWidth ||
				!decoded.naturalHeight ||
				decoded.naturalWidth * decoded.naturalHeight > 50_000_000
			) {
				throw new Error("Choose a photo with fewer than 50 million pixels.");
			}
			if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
			sourceUrlRef.current = objectUrl;
			setImage(decoded);
			setComparison("edited");
			setFileName(file.name.replace(/\.[^.]+$/, ""));
			resetAdjustments();
			setMessage("Photo ready. Adjust the framing, then download your square profile photo.");
		} catch (caught) {
			URL.revokeObjectURL(objectUrl);
			if (sequence === uploadSequence.current)
				setError(
					caught instanceof Error && caught.message.startsWith("Choose a photo")
						? caught.message
						: "Couldn’t read this photo. Try another JPG, PNG, or WebP image.",
				);
		} finally {
			if (sequence === uploadSequence.current) setLoading(false);
		}
	}

	function removePhoto() {
		uploadSequence.current += 1;
		if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
		sourceUrlRef.current = null;
		setImage(null);
		setComparison("edited");
		setPreviewShape("square");
		setLoading(false);
		resetAdjustments();
		setError("");
		setMessage("Photo removed from this editor.");
	}

	function downloadPhoto() {
		const canvas = canvasRef.current;
		if (!image || !canvas) return;
		setDownloading(true);
		setError("");
		try {
			canvas.toBlob((blob) => {
				setDownloading(false);
				if (!blob) {
					setError("Couldn’t export this photo. Try uploading it again.");
					return;
				}
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				const safeName =
					fileName
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-|-$/g, "") || "profile";
				link.download = `${safeName}-profile.png`;
				link.click();
				window.setTimeout(() => URL.revokeObjectURL(url), 1000);
				setDownloaded(true);
				setMessage("Your 1,024 × 1,024 PNG is ready. Check your downloads.");
			}, "image/png");
		} catch {
			setDownloading(false);
			setError("Couldn’t export this photo. Try uploading it again.");
		}
	}

	return (
		<div className="feature-view photo-view">
			<div className="feature-heading">
				<div>
					<h1>Put your best face forward.</h1>
					<p className="muted">A polished profile photo, made from a photo of your own.</p>
				</div>
				<button className="button secondary" onClick={() => inputRef.current?.click()} disabled={loading}>
					<Upload size={16} />
					{loading ? "Opening photo…" : image ? "Replace photo" : "Upload a photo"}
				</button>
			</div>
			<div className="notice">
				<ShieldCheck size={18} />
				<span>Photo editing runs on this device. AI headshots require a connected image provider.</span>
			</div>
			<ol className="photo-steps" aria-label="Photo editing progress">
				<li className={`photo-step ${image ? "done" : "active"}`} aria-current={!image ? "step" : undefined}>
					<span>{image ? <Check size={15} /> : "1"}</span>
					<strong>Upload</strong>
				</li>
				<li
					className={`photo-step ${downloaded ? "done" : image ? "active" : ""}`}
					aria-current={image && !downloaded ? "step" : undefined}
				>
					<span>{downloaded ? <Check size={15} /> : "2"}</span>
					<strong>Polish</strong>
				</li>
				<li className={`photo-step ${downloaded ? "done active" : ""}`} aria-current={downloaded ? "step" : undefined}>
					<span>{downloaded ? <Check size={15} /> : "3"}</span>
					<strong>Download</strong>
				</li>
			</ol>
			{error ? (
				<div className="notice error" role="alert">
					{error}
				</div>
			) : null}
			{message ? (
				<div className="notice" role="status">
					<Check size={16} />
					{message}
				</div>
			) : null}
			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				aria-label="Upload profile photo"
				hidden
				onChange={uploadPhoto}
			/>
			<div className="photo-layout">
				<section className="panel photo-preview-panel" aria-label="Profile photo preview">
					<div className="panel-heading">
						<h2 className="section-title">Your new first impression</h2>
						<span className="status">1:1 PNG export</span>
					</div>
					{image ? (
						<div>
							<div className="photo-compare-controls">
								<div className="tabs" role="group" aria-label="Compare photo finish">
									{(["original", "edited"] as const).map((mode) => (
										<button
											key={mode}
											type="button"
											className={`tab ${comparison === mode ? "active" : ""}`}
											aria-pressed={comparison === mode}
											onClick={() => setComparison(mode)}
										>
											{mode === "original" ? "Original" : "Edited"}
										</button>
									))}
								</div>
								<div className="tabs" role="group" aria-label="Preview shape">
									{(["square", "circle"] as const).map((shape) => (
										<button
											key={shape}
											type="button"
											className={`tab ${previewShape === shape ? "active" : ""}`}
											aria-pressed={previewShape === shape}
											onClick={() => setPreviewShape(shape)}
										>
											{shape === "square" ? "Square" : "Circle"}
										</button>
									))}
								</div>
							</div>
							<div className="photo-preview">
								<div
									className={`photo-canvas-stack ${previewShape === "circle" ? "circle-preview" : ""}`}
									style={{ width: "100%" }}
								>
									<canvas
										ref={canvasRef}
										width={OUTPUT_SIZE}
										height={OUTPUT_SIZE}
										aria-label="Edited profile photo preview"
										style={{
											display: comparison === "edited" ? "block" : "none",
											width: "100%",
											height: "auto",
											borderRadius: 12,
										}}
									>
										Your browser cannot display the photo editor. Try a current browser.
									</canvas>
									<canvas
										ref={originalCanvasRef}
										width={OUTPUT_SIZE}
										height={OUTPUT_SIZE}
										aria-label="Original photo with current crop"
										style={{
											display: comparison === "original" ? "block" : "none",
											width: "100%",
											height: "auto",
											borderRadius: 12,
										}}
									/>
								</div>
							</div>
							<p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
								Original uses the same crop without your finish or exposure edits. Circle is a preview only; downloads
								always use your edited, square PNG.
							</p>
						</div>
					) : (
						<div className="photo-placeholder">
							<div className="feature-icon">
								<Camera size={38} />
							</div>
							<h2>Start with a photo you love.</h2>
							<p className="muted">
								Upload a well-lit photo with your face clearly visible. Frame it, find your tone, and make it yours.
							</p>
							<button className="button primary" onClick={() => inputRef.current?.click()} disabled={loading}>
								<ImagePlus size={17} />
								{loading ? "Opening photo…" : "Choose a photo"}
							</button>
							<small className="muted">JPG, PNG, or WebP · Up to 12 MB</small>
						</div>
					)}
					<div className="resume-actions" style={{ justifyContent: "space-between", marginTop: 20 }}>
						<small className="muted">
							{image ? "PNG export · 1,024 × 1,024 pixels" : "Your original photo stays on this device."}
						</small>
						{image ? (
							<button className="button secondary small danger" onClick={removePhoto}>
								<Trash2 size={15} />
								Remove photo
							</button>
						) : null}
					</div>
				</section>
				<section className="panel photo-controls" aria-label="Photo adjustments">
					<div className="panel-heading">
						<div>
							<h2 className="section-title">Find your best angle.</h2>
							<p className="muted">Small changes. A more confident introduction.</p>
						</div>
						<SlidersHorizontal size={19} />
					</div>
					<h3 className="section-title">Choose a finish</h3>
					<div className="preset-grid">
						{presets.map((item) => (
							<button
								key={item.id}
								className={`preset-button ${preset === item.id ? "active" : ""}`}
								aria-pressed={preset === item.id}
								disabled={!image}
								onClick={() => setPreset(item.id)}
							>
								<strong>{item.label}</strong>
								<small>{item.description}</small>
								{preset === item.id ? <Check size={15} /> : null}
							</button>
						))}
					</div>
					<h3 className="section-title" style={{ marginTop: 28 }}>
						Framing & light
					</h3>
					<Adjustment
						id="photo-zoom"
						label="Zoom"
						value={zoom}
						min={1}
						max={3}
						step={0.01}
						display={`${zoom.toFixed(2)}×`}
						disabled={!image}
						onChange={setZoom}
					/>
					<Adjustment
						id="photo-horizontal"
						label="Horizontal framing"
						value={focalX}
						min={-100}
						max={100}
						display={focalX === 0 ? "Centered" : `${focalX > 0 ? "Right" : "Left"} ${Math.abs(focalX)}%`}
						disabled={!image}
						onChange={setFocalX}
					/>
					<Adjustment
						id="photo-vertical"
						label="Vertical framing"
						value={focalY}
						min={-100}
						max={100}
						display={focalY === 0 ? "Centered" : `${focalY > 0 ? "Bottom" : "Top"} ${Math.abs(focalY)}%`}
						disabled={!image}
						onChange={setFocalY}
					/>
					<Adjustment
						id="photo-exposure"
						label="Exposure"
						value={exposure}
						min={65}
						max={145}
						display={`${exposure}%`}
						disabled={!image}
						onChange={setExposure}
					/>
					<p className="muted">
						Zoom in to create room for reframing. Keep your eyes near the upper third of the square.
					</p>
					<div className="resume-actions" style={{ marginTop: 24 }}>
						<button className="button primary" disabled={!image || loading || downloading} onClick={downloadPhoto}>
							<Download size={16} />
							{downloading ? "Preparing PNG…" : "Download photo"}
						</button>
						<button className="button secondary" disabled={!image} onClick={resetAdjustments}>
							<RotateCcw size={15} />
							Reset adjustments
						</button>
					</div>
					<p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
						This editor crops and adjusts your photo. It does not generate a new headshot or change your face. Uploaded
						photos are held in memory and cleared when you leave this page.
					</p>
				</section>
			</div>
		</div>
	);
}
