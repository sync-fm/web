import { SiApplemusic, SiSpotify, SiYoutubemusic } from "react-icons/si";

export const streamingServices = [
	{
		name: "Spotify",
		service: "spotify",
		color: "#1DB954",
		secondaryColor: "#1DB954",
		Logo: SiSpotify,
		text: "Listen now",
	},
	{
		name: "YouTube Music",
		service: "ytmusic",
		color: "#FF0000",
		secondaryColor: "#FF0000",
		Logo: SiYoutubemusic,
		text: "Watch now",
	},
	{
		name: "Apple Music",
		service: "applemusic",
		color: "#FA233B",
		secondaryColor: "#FB5C74",
		Logo: SiApplemusic,
		text: "Open app",
	},
];
