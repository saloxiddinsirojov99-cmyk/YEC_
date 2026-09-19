import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Carpet } from '@/types/carpet';
import { formatPrice } from '@/utils/price';
import { getPrimaryCarpetImageUrl, FALLBACK_CARPET_IMAGE } from '@/utils/image';
import { useFavoritesStore } from '@/store/favorites.store';

interface CarpetCardProps {
  carpet: Carpet;
  onPress?: () => void;
}

export const CarpetCard: React.FC<CarpetCardProps> = ({ carpet, onPress }) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorite(carpet.id);

  const imageUrl = imageError
    ? FALLBACK_CARPET_IMAGE
    : getPrimaryCarpetImageUrl(carpet.images);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/carpet/${carpet.id}` as any);
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation?.();
    toggleFavorite(carpet);
  };

  const hasDiscount =
    carpet.discountPercent !== undefined && carpet.discountPercent > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={handlePress}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="small" color="#94a3b8" />
          </View>
        )}

        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />

        {/* Badges Overlay */}
        <View style={styles.topBadgesRow}>
          {hasDiscount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{carpet.discountPercent}%</Text>
            </View>
          ) : (
            <View />
          )}

          {/* Favorite Toggle Button */}
          <TouchableOpacity
            style={[styles.favoriteBtn, favorited && styles.favoriteBtnActive]}
            activeOpacity={0.7}
            onPress={handleFavoritePress}
          >
            <Text style={styles.favoriteIcon}>{favorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {carpet.type === 'ROLL' && (
          <View style={styles.rollBadge}>
            <Text style={styles.rollBadgeText}>METRAJ</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {carpet.name}
        </Text>

        <View style={styles.metaRow}>
          {carpet.size ? (
            <Text style={styles.sizeText} numberOfLines={1}>
              📏 {carpet.size}
            </Text>
          ) : null}
          {carpet.material ? (
            <Text style={styles.materialText} numberOfLines={1}>
              • {carpet.material}
            </Text>
          ) : null}
        </View>

        {/* Price & Action */}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(carpet.price)}</Text>
          <View style={styles.detailArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 175,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  topBadgesRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  rollBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rollBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  favoriteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteBtnActive: {
    backgroundColor: '#ffffff',
  },
  favoriteIcon: {
    fontSize: 15,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  sizeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  materialText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  priceContainer: {
    marginBottom: 4,
  },
  oldPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284c7',
  },
  detailArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: '700',
  },
});

export default CarpetCard;
