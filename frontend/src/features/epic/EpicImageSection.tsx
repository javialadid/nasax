import React from 'react';
import Carousel from '../../components/Carousel/Carousel';
import ZoomModal from '../../components/ZoomModal';

interface EpicImageSectionProps {
  imageUrls: string[];
  carouselIdx: number;
  setCarouselIdx: React.Dispatch<React.SetStateAction<number>>;
  autoPlay: boolean;
  setAutoPlay: React.Dispatch<React.SetStateAction<boolean>>;
  showZoomModal: boolean;
  setShowZoomModal: React.Dispatch<React.SetStateAction<boolean>>;
  currentImg: any;
}

const EpicImageSection: React.FC<EpicImageSectionProps> = ({
  imageUrls,
  carouselIdx,
  setCarouselIdx,
  autoPlay,
  setAutoPlay,
  showZoomModal,
  setShowZoomModal,
  currentImg,
}) => (
  <div className="w-full h-full flex items-center justify-center flex-shrink-0">
    <Carousel
      showThumbnails={true}
      imageUrls={imageUrls}
      order={"desc"}
      onIndexChange={setCarouselIdx}
      currentIndex={carouselIdx}
      autoPlay={autoPlay}
      cropLeft={0.09}
      cropRight={0.09}
      cropTop={0.09}
      cropBottom={0.09}
      imageFit="contain"
      className="picture-shadow "
      imageClassName="picture-shadow w-full h-full object-contain rounded-lg mx-auto group-hover:opacity-90 transition-opacity self-start max-h-full max-w-full"
      onImageClick={() => setShowZoomModal(true)}
      showArrows={!showZoomModal}
    />
    {showZoomModal && currentImg && (
      <ZoomModal
        imageUrl={imageUrls[carouselIdx]}
        title={currentImg.caption || currentImg.image}
        onClose={() => setShowZoomModal(false)}
        onPrev={() => setCarouselIdx(idx => Math.max(0, idx - 1))}
        onNext={() => setCarouselIdx(idx => Math.min(imageUrls.length - 1, idx + 1))}
        canPrev={carouselIdx > 0}
        canNext={carouselIdx < imageUrls.length - 1}
      />
    )}
  </div>
);

export default EpicImageSection; 