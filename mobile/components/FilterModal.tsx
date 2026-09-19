import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFilterOptions } from '@/hooks/useCarpetCatalog';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCollection?: string;
  onSelectCollection: (col?: string) => void;
  selectedMaterial?: string;
  onSelectMaterial: (mat?: string) => void;
  selectedSize?: string;
  onSelectSize: (sz?: string) => void;
  onReset: () => void;
  kind?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedCollection,
  onSelectCollection,
  selectedMaterial,
  onSelectMaterial,
  selectedSize,
  onSelectSize,
  onReset,
  kind,
}) => {
  const { names, materials, sizes, isLoading } = useFilterOptions(kind);

  const activeCount =
    (selectedCollection ? 1 : 0) +
    (selectedMaterial ? 1 : 0) +
    (selectedSize ? 1 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Filtrlar</Text>
              {activeCount > 0 && (
                <Text style={styles.subtext}>
                  {activeCount} ta parametr tanlandi
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.loadingText}>Filtrlar yuklanmoqda...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Collection / Name Filter */}
              {names.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Kolleksiya ({names.length})
                  </Text>
                  <View style={styles.chipsWrap}>
                    {names.map((item) => {
                      const isSelected = selectedCollection === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() =>
                            onSelectCollection(isSelected ? undefined : item)
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Material Filter */}
              {materials.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Material ({materials.length})
                  </Text>
                  <View style={styles.chipsWrap}>
                    {materials.map((item) => {
                      const isSelected = selectedMaterial === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() =>
                            onSelectMaterial(isSelected ? undefined : item)
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Size Filter */}
              {sizes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    O'lcham ({sizes.length})
                  </Text>
                  <View style={styles.chipsWrap}>
                    {sizes.map((item) => {
                      const isSelected = selectedSize === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() =>
                            onSelectSize(isSelected ? undefined : item)
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetBtn}
              activeOpacity={0.7}
              onPress={onReset}
            >
              <Text style={styles.resetBtnText}>Tozalash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.applyBtnText}>Natijalarni ko'rish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtext: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
});
