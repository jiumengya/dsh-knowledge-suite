window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-knowledge",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region \0dsh-css:D:\项目\deepseek-harness\packages\client\ui-knowledge\src\client\KnowledgeSection.module.css.mjs
		const css = "._1AnSPq_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}._1AnSPq_title{margin:0;font-size:18px;font-weight:600}._1AnSPq_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:1.55}._1AnSPq_toolbar{flex-wrap:wrap;align-items:center;gap:10px;display:flex}._1AnSPq_hint{color:var(--dsw-alias-label-tertiary);font-size:12px}._1AnSPq_fileInput,._1AnSPq_visuallyHidden{clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}._1AnSPq_report{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:10px;flex-direction:column;gap:6px;padding:10px 12px;display:flex}._1AnSPq_reportHead{letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;font-weight:600}._1AnSPq_reportList{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}._1AnSPq_reportRow{align-items:baseline;gap:10px;font-size:13px;display:flex}._1AnSPq_reportFilename{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}._1AnSPq_reportStatus{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere}._1AnSPq_reportRowProblem ._1AnSPq_reportStatus{color:var(--dsw-alias-state-error-primary)}._1AnSPq_empty{border:1px dashed var(--dsw-alias-border-l3);text-align:center;border-radius:12px;flex-direction:column;align-items:center;gap:4px;padding:28px 16px;display:flex}._1AnSPq_emptyTitle{margin:0;font-size:14px;font-weight:600}._1AnSPq_emptyIntro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px}._1AnSPq_table{border-collapse:collapse;width:100%;font-size:13px}._1AnSPq_th{text-align:left;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);border-bottom:1px solid var(--dsw-alias-border-l2);padding:4px 10px;font-size:12px;font-weight:600}._1AnSPq_th:first-child{padding-left:0}._1AnSPq_td{border-bottom:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);white-space:nowrap;padding:10px}._1AnSPq_td:first-child{padding-left:0}._1AnSPq_tr:last-child ._1AnSPq_td{border-bottom:0}._1AnSPq_tdDocument{flex-direction:column;gap:2px;max-width:360px;display:flex}._1AnSPq_docTitle{color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;font-weight:500}._1AnSPq_docFilename{font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Menlo, monospace);color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:11px}._1AnSPq_formatBadge{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);text-transform:uppercase;border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px}._1AnSPq_tdActions{text-align:right;width:1%}._1AnSPq_iconButton{appearance:none;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:7px;align-items:center;padding:6px;display:inline-flex;position:relative}._1AnSPq_iconButton:disabled{opacity:.4;cursor:default}._1AnSPq_iconButton:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}._1AnSPq_iconButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}._1AnSPq_iconButton:after{content:attr(data-tip);background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);white-space:nowrap;opacity:0;pointer-events:none;border-radius:6px;padding:3px 8px;font-size:11px;line-height:17px;transition:opacity .12s;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translate(-50%)}._1AnSPq_iconButton:hover:after,._1AnSPq_iconButton:focus-visible:after{opacity:1}._1AnSPq_iconDanger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}._1AnSPq_secondaryButton{color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:7px;align-self:flex-start;padding:5px 8px;font-size:12.5px}._1AnSPq_secondaryButton:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}._1AnSPq_secondaryButton:disabled{opacity:.5;cursor:default}._1AnSPq_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px}._1AnSPq_deleteDialog{width:min(480px,100%)}._1AnSPq_deleteConfirm:not(:disabled){border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}._1AnSPq_deleteConfirm:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}";
		const tagId = "@deepseek-ai/dsh-client-ui-knowledge/KnowledgeSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-knowledge";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var KnowledgeSection_module_css_default = {
			"deleteConfirm": "_1AnSPq_deleteConfirm",
			"deleteDialog": "_1AnSPq_deleteDialog",
			"docFilename": "_1AnSPq_docFilename",
			"docTitle": "_1AnSPq_docTitle",
			"empty": "_1AnSPq_empty",
			"emptyIntro": "_1AnSPq_emptyIntro",
			"emptyTitle": "_1AnSPq_emptyTitle",
			"error": "_1AnSPq_error",
			"fileInput": "_1AnSPq_fileInput",
			"formatBadge": "_1AnSPq_formatBadge",
			"hint": "_1AnSPq_hint",
			"iconButton": "_1AnSPq_iconButton",
			"iconDanger": "_1AnSPq_iconDanger",
			"intro": "_1AnSPq_intro",
			"report": "_1AnSPq_report",
			"reportFilename": "_1AnSPq_reportFilename",
			"reportHead": "_1AnSPq_reportHead",
			"reportList": "_1AnSPq_reportList",
			"reportRow": "_1AnSPq_reportRow",
			"reportRowProblem": "_1AnSPq_reportRowProblem",
			"reportStatus": "_1AnSPq_reportStatus",
			"secondaryButton": "_1AnSPq_secondaryButton",
			"section": "_1AnSPq_section",
			"table": "_1AnSPq_table",
			"td": "_1AnSPq_td",
			"tdActions": "_1AnSPq_tdActions",
			"tdDocument": "_1AnSPq_tdDocument",
			"th": "_1AnSPq_th",
			"title": "_1AnSPq_title",
			"toolbar": "_1AnSPq_toolbar",
			"tr": "_1AnSPq_tr",
			"visuallyHidden": "_1AnSPq_visuallyHidden"
		};
		//#endregion
		//#region src/client/KnowledgeSection.tsx
		/**
		* Knowledge settings section: the document library as a table, an upload
		* picker that reports each file's outcome, and a delete confirmation.
		*
		* The browser edits no document text — the page's whole job is moving files
		* in and out of the host library, because retrieval happens model-side (the
		* pre-step recall and the knowledge tool) and never renders here. An empty
		* library is the section's first-run state, not a failure: the intro and the
		* upload button are what it shows.
		*/
		/**
		* Render one epoch-milliseconds stamp in the reading locale's calendar.
		* @param epochMs - the host-reported `updatedAt` (or `createdAt`).
		* @returns the localized date-time text.
		*/
		function formatWhen(epochMs) {
			return new Date(epochMs).toLocaleString();
		}
		/**
		* Map one host skip/failure reason onto localized copy.
		* @param reason - the host-reported `KnowledgeSkipView.reason` (or a failure detail).
		* @param t - the section locale lookup.
		* @returns localized text for the known reasons; the verbatim reason otherwise.
		*/
		function localizeReason(reason, t) {
			if (reason === "no extractable text") return t("reasonNoText");
			if (reason === "unsupported filename or format") return t("reasonUnsupported");
			if (/^upload exceeds the \d+-byte cap$/.test(reason)) return t("reasonTooLarge");
			const failed = /^extraction failed: (.+)$/.exec(reason);
			if (failed) return t("reasonExtractionFailed").replace("{detail}", failed[1]);
			return reason;
		}
		/** The label one upload-report row shows for its file's stage. */
		function uploadLabel(row, t) {
			switch (row.status) {
				case "reading":
				case "sending": return t("uploading");
				case "ingested": return t("uploadIngested");
				case "skipped": return `${t("uploadSkipped")}: ${localizeReason(row.reason ?? "", t)}`;
				default: return `${t("uploadFailed")}: ${localizeReason(row.reason ?? "", t)}`;
			}
		}
		/**
		* Render the Knowledge section content column.
		* @param props - composed slot props.
		* @returns the section.
		*/
		function KnowledgeSection(props) {
			const { useKnowledgeSection, t, load, upload, dismissUploads, confirmDelete } = props;
			const state = useKnowledgeSection((snapshot) => snapshot);
			const fileInput = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const uploading = state.uploads.some((row) => row.status === "reading" || row.status === "sending");
			const reportSettled = state.uploads.length > 0 && !uploading;
			const report = state.uploads.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: KnowledgeSection_module_css_default.report,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: KnowledgeSection_module_css_default.reportHead,
						children: t("uploadReport")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: KnowledgeSection_module_css_default.reportList,
						children: state.uploads.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: row.status === "failed" || row.status === "skipped" ? `${KnowledgeSection_module_css_default.reportRow} ${KnowledgeSection_module_css_default.reportRowProblem}` : KnowledgeSection_module_css_default.reportRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KnowledgeSection_module_css_default.reportFilename,
								children: row.filename
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KnowledgeSection_module_css_default.reportStatus,
								role: row.status === "failed" ? "alert" : void 0,
								children: uploadLabel(row, t)
							})]
						}, row.filename))
					}),
					reportSettled ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: KnowledgeSection_module_css_default.secondaryButton,
						onClick: () => {
							dismissUploads();
						},
						children: t("dismiss")
					}) : null
				]
			});
			if (state.status === "error") {
				/* v8 ignore next -- an error status always carries text; the fallback satisfies the nullable type */
				const detail = state.error ?? "";
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: KnowledgeSection_module_css_default.section,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							className: KnowledgeSection_module_css_default.title,
							children: t("nav")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: KnowledgeSection_module_css_default.error,
							role: "alert",
							children: `${t("error")} ${detail}`
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: KnowledgeSection_module_css_default.secondaryButton,
							onClick: () => {
								load();
							},
							children: t("retry")
						}),
						report
					]
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: KnowledgeSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: KnowledgeSection_module_css_default.title,
						children: t("nav")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: KnowledgeSection_module_css_default.intro,
						children: t("intro")
					}),
					state.error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: KnowledgeSection_module_css_default.error,
						role: "alert",
						children: state.error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KnowledgeSection_module_css_default.toolbar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								disabled: uploading,
								onClick: () => {
									fileInput.current?.click();
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 14 }), uploading ? t("uploading") : t("upload")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: fileInput,
								className: KnowledgeSection_module_css_default.fileInput,
								type: "file",
								multiple: true,
								accept: ".pdf,.docx,.txt,.md,.html",
								"aria-label": t("upload"),
								onChange: (event) => {
									const files = [...event.target.files ?? []];
									event.target.value = "";
									if (files.length > 0) upload(files);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: KnowledgeSection_module_css_default.hint,
								children: t("uploadHint")
							})
						]
					}),
					report,
					state.status === "ready" && state.rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: KnowledgeSection_module_css_default.empty,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: KnowledgeSection_module_css_default.emptyTitle,
							children: t("emptyTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: KnowledgeSection_module_css_default.emptyIntro,
							children: t("emptyIntro")
						})]
					}) : null,
					state.rows.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
						className: KnowledgeSection_module_css_default.table,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: KnowledgeSection_module_css_default.th,
								children: t("columnDocument")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: KnowledgeSection_module_css_default.th,
								children: t("columnFormat")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: KnowledgeSection_module_css_default.th,
								children: t("columnChunks")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: KnowledgeSection_module_css_default.th,
								children: t("columnUpdated")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: KnowledgeSection_module_css_default.th,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: KnowledgeSection_module_css_default.visuallyHidden,
									children: t("columnActions")
								})
							})
						] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: state.rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
							className: KnowledgeSection_module_css_default.tr,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
									className: KnowledgeSection_module_css_default.tdDocument,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: KnowledgeSection_module_css_default.docTitle,
										children: row.title
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										className: KnowledgeSection_module_css_default.docFilename,
										children: row.filename
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: KnowledgeSection_module_css_default.td,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: KnowledgeSection_module_css_default.formatBadge,
										children: row.format
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
									className: KnowledgeSection_module_css_default.td,
									children: [
										row.chunkCount,
										" ",
										t("chunks")
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: KnowledgeSection_module_css_default.td,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
										dateTime: new Date(row.updatedAt).toISOString(),
										children: formatWhen(row.updatedAt)
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
									className: KnowledgeSection_module_css_default.tdActions,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: `${KnowledgeSection_module_css_default.iconButton} ${KnowledgeSection_module_css_default.iconDanger}`,
										disabled: state.deleting,
										"data-tip": t("delete"),
										"aria-label": `${t("delete")}: ${row.title}`,
										onClick: () => {
											confirmDelete(row.id);
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {})
									})
								})
							]
						}, row.id)) })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: state.pendingDelete !== null,
						onClose: () => {
							confirmDelete(null);
						},
						title: t("deleteTitle"),
						closeLabel: t("close"),
						description: t("deleteDescription"),
						className: KnowledgeSection_module_css_default.deleteDialog,
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							autoFocus: true,
							disabled: state.deleting,
							onClick: () => {
								confirmDelete(null);
							},
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							className: KnowledgeSection_module_css_default.deleteConfirm,
							disabled: state.deleting,
							onClick: () => {
								props.remove();
							},
							children: state.deleting ? t("deleting") : t("deleteConfirm")
						})] })
					})
				]
			});
		}
		//#endregion
		//#region src/client/section-store.ts
		/**
		* Human text for a rejected wire call. A transport failure rejects with an
		* Error; a host or a runtime can reject with anything, and the surface still
		* has to say something.
		* @param error - the rejection value.
		* @returns the message to show.
		*/
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* Encode upload bytes as the canonical base64 the knowledge wire accepts.
		*
		* `btoa` over one spread of a multi-megabyte file overflows the argument
		* limit, so the string is assembled in bounded chunks. `btoa` emits canonical
		* base64 (final partial group padded with `=`), which is exactly the form the
		* host's round-trip check demands.
		* @param bytes - the complete file bytes.
		* @returns the canonical base64 text.
		*/
		function encodeUploadBase64(bytes) {
			let binary = "";
			for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
			return btoa(binary);
		}
		const INITIAL = {
			status: "idle",
			error: null,
			rows: [],
			uploads: [],
			pendingDelete: null,
			deleting: false
		};
		/** Reads the library and drives uploads and deletes. */
		var KnowledgeSectionController = class {
			api;
			/** Page snapshot the renderer subscribes to. */
			store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(INITIAL);
			constructor(api) {
				this.api = api;
			}
			set(patch) {
				this.store.set({
					...this.store.getSnapshot(),
					...patch
				});
			}
			patchUpload(index, patch) {
				const { uploads } = this.store.getSnapshot();
				const row = uploads[index];
				if (row === void 0) return;
				const next = [...uploads];
				next[index] = {
					...row,
					...patch
				};
				this.set({ uploads: next });
			}
			/**
			* Load the library. An empty library is a valid state rather than a
			* failure — the section shows its empty intro and the upload button.
			* @returns once the snapshot reflects the host.
			*/
			async load() {
				if (this.store.getSnapshot().status === "loading") return;
				this.set({
					status: "loading",
					error: null
				});
				try {
					const result = await this.api.list();
					if (!result.ok) {
						this.set({
							status: "error",
							error: result.error.message
						});
						return;
					}
					this.set({
						status: "ready",
						error: null,
						rows: result.value
					});
				} catch (error) {
					this.set({
						status: "error",
						error: messageOf(error)
					});
				}
			}
			/**
			* Upload the selected files one by one, reporting each outcome on its own
			* row, then re-read the library when at least one landed.
			*
			* One file per request: the store ingests sequentially anyway (each upload
			* rewrites the whole library JSON), and a per-file report is what the page
			* shows — batching would turn three clear outcomes into one opaque failure.
			* @param files - the files the picker handed over.
			* @returns once every selected file settled and the page reflects them.
			*/
			async upload(files) {
				if (files.length === 0) return;
				if (this.store.getSnapshot().uploads.some((row) => row.status === "reading" || row.status === "sending")) return;
				this.set({
					error: null,
					uploads: files.map((file) => ({
						filename: file.name,
						status: "reading"
					}))
				});
				let anyIngested = false;
				for (const [index, file] of files.entries()) try {
					const bytes = new Uint8Array(await file.arrayBuffer());
					this.patchUpload(index, { status: "sending" });
					const result = await this.api.ingest(file.name, encodeUploadBase64(bytes), void 0);
					if (!result.ok) {
						this.patchUpload(index, {
							status: "failed",
							reason: result.error.message
						});
						continue;
					}
					const { ingested, skipped } = result.value;
					if (ingested.length > 0) {
						anyIngested = true;
						this.patchUpload(index, { status: "ingested" });
					} else this.patchUpload(index, {
						status: "skipped",
						reason: skipped[0]?.reason ?? ""
					});
				} catch (error) {
					this.patchUpload(index, {
						status: "failed",
						reason: messageOf(error)
					});
				}
				if (anyIngested) await this.load();
			}
			/** Clear the settled upload report. */
			dismissUploads() {
				this.set({ uploads: [] });
			}
			/**
			* Ask for confirmation before deleting one entry.
			* @param id - the entry to delete, or null to dismiss the confirmation.
			*/
			confirmDelete(id) {
				if (this.store.getSnapshot().deleting) return;
				this.set({ pendingDelete: id });
			}
			/**
			* Delete the entry awaiting confirmation, then re-read the library.
			* @returns once the delete settled and the page reflects it.
			*/
			async remove() {
				const { pendingDelete, deleting } = this.store.getSnapshot();
				if (pendingDelete === null || deleting) return;
				this.set({
					deleting: true,
					error: null
				});
				try {
					const result = await this.api.removeDocument(pendingDelete);
					if (!result.ok) {
						this.set({
							deleting: false,
							pendingDelete: null,
							error: result.error.message
						});
						return;
					}
					this.set({
						deleting: false,
						pendingDelete: null
					});
					await this.load();
				} catch (error) {
					this.set({
						deleting: false,
						pendingDelete: null,
						error: messageOf(error)
					});
				}
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/** English copy. */
		const en = {
			nav: "Knowledge",
			intro: "Documents you upload here become the session's document library: the agent's retrieval step searches them for relevant passages and the model can search them through the knowledge tool.",
			upload: "Upload documents",
			uploading: "Uploading…",
			uploadHint: "PDF, Word, Markdown, HTML, or plain text; uploading the same filename again replaces it.",
			emptyTitle: "The library is empty",
			emptyIntro: "Upload a PDF or Word document to make it searchable during your sessions.",
			columnDocument: "Document",
			columnFormat: "Format",
			columnChunks: "Chunks",
			columnUpdated: "Updated",
			columnActions: "Actions",
			chunks: "chunks",
			uploadReport: "Upload results",
			uploadIngested: "Added to the library.",
			uploadSkipped: "Skipped",
			uploadFailed: "Failed",
			reasonNoText: "no extractable text in this file — scanned or image-only PDFs carry no text layer, so it cannot be indexed",
			reasonUnsupported: "unsupported filename or format",
			reasonTooLarge: "file exceeds the upload size cap",
			reasonExtractionFailed: "text extraction failed: {detail}",
			dismiss: "Dismiss",
			delete: "Delete",
			deleteTitle: "Delete this document?",
			deleteDescription: "The document and its extracted chunks are removed permanently. Sessions keep only what they already read.",
			deleteConfirm: "Delete",
			deleting: "Deleting…",
			cancel: "Cancel",
			close: "Close",
			retry: "Retry",
			error: "Could not read the document library."
		};
		/** Simplified Chinese copy. */
		const zh = {
			nav: "资料库",
			intro: "在这里上传的文档会成为会话的资料库：检索步骤会从中找出相关段落，模型也可以通过 knowledge 工具检索它们。",
			upload: "上传文档",
			uploading: "正在上传…",
			uploadHint: "支持 PDF、Word、Markdown、HTML 与纯文本；同名文件再次上传会替换原条目。",
			emptyTitle: "资料库为空",
			emptyIntro: "上传一份 PDF 或 Word 文档，让会话期间可以检索它的内容。",
			columnDocument: "文档",
			columnFormat: "格式",
			columnChunks: "分块",
			columnUpdated: "更新时间",
			columnActions: "操作",
			chunks: "块",
			uploadReport: "上传结果",
			uploadIngested: "已加入资料库。",
			uploadSkipped: "已跳过",
			uploadFailed: "失败",
			reasonNoText: "文件里没有可提取的文本——扫描件或纯图片 PDF 没有文本层，无法收录，请换用含文字的版本",
			reasonUnsupported: "不支持的文件名或格式",
			reasonTooLarge: "文件大小超过上传上限",
			reasonExtractionFailed: "文本提取失败：{detail}",
			dismiss: "知道了",
			delete: "删除",
			deleteTitle: "删除这份文档？",
			deleteDescription: "文档及其提取的分块将被永久删除。会话已读取的内容不受影响。",
			deleteConfirm: "删除",
			deleting: "正在删除…",
			cancel: "取消",
			close: "关闭",
			retry: "重试",
			error: "无法读取资料库。"
		};
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace the section registers. */
		const NS = "settings.knowledge";
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"locale",
			"remote",
			"remote.knowledge"
		];
		/**
		* Mount the Knowledge settings section.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			const section = new KnowledgeSectionController(ctx.remote.knowledge);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-knowledge: settings section dictionaries");
			ctx.effect(() => {
				const dispose = ctx.on("connection/reset", () => {
					if (section.store.getSnapshot().status !== "idle") section.load();
				});
				return () => {
					dispose();
				};
			}, "ui-knowledge: library repull on reconnect");
			const injected = () => ({
				hooks: { knowledgeSection: section.store },
				load: () => section.load(),
				upload: (files) => section.upload(files),
				dismissUploads: () => {
					section.dismissUploads();
				},
				confirmDelete: (id) => {
					section.confirmDelete(id);
				},
				remove: () => section.remove()
			});
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "knowledge",
				order: 25,
				label: () => ctx.locale.bind(NS)("nav"),
				locale: NS,
				inject: injected
			}, KnowledgeSection));
		}
		//#endregion
		exports.KnowledgeSectionController = KnowledgeSectionController;
		exports.NS = NS;
		exports.apply = apply;
		exports.encodeUploadBase64 = encodeUploadBase64;
		exports.formatWhen = formatWhen;
		exports.inject = inject;
		exports.messageOf = messageOf;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map