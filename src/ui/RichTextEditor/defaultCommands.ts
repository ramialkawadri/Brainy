import {
	mdiFormatBold,
	mdiFormatItalic,
	mdiFormatListBulleted,
	mdiFormatListNumbered,
	mdiFormatSubscript,
	mdiFormatSuperscript,
	mdiFormatUnderline,
} from "@mdi/js";
import { Command } from "./Command";

export const defaultCommands: Command[] = [
	{
		name: "bold",
		title: "Bold",
		icon: mdiFormatBold,
		onClick: c => c.toggleBold(),
	},
	{
		name: "italic",
		title: "Italic",
		icon: mdiFormatItalic,
		onClick: c => c.toggleItalic(),
	},
	{
		name: "underline",
		title: "Underline",
		icon: mdiFormatUnderline,
		onClick: c => c.toggleUnderline(),
	},
	{
		name: "orderedList",
		title: "Ordered list",
		icon: mdiFormatListNumbered,
		onClick: c => c.toggleOrderedList(),
	},
	{
		name: "bulletList",
		title: "Bullet list",
		icon: mdiFormatListBulleted,
		onClick: c => c.toggleBulletList(),
	},
	{
		name: "subscript",
		title: "Subscript",
		icon: mdiFormatSubscript,
		onClick: c => c.toggleSubscript(),
	},
	{
		name: "superscript",
		title: "Superscript",
		icon: mdiFormatSuperscript,
		onClick: c => c.toggleSuperscript(),
	},
];
