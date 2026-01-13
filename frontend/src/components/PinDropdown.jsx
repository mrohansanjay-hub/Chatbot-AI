import Files from "../pages/Files";
import Audios from "../pages/Audios";
import Videos from "../pages/Videos";
import Photos from "../pages/Photos";

export default function PinDropdown({ onSelect }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white shadow-md rounded p-2 z-50 flex flex-col gap-1 w-36">
      {/* Each button triggers the file explorer */}
      <Files onSelect={onSelect} />
      <Audios onSelect={onSelect} />
      <Videos onSelect={onSelect} />
      <Photos onSelect={onSelect} />
    </div>
  );
}
