import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useWalletStore } from "../stores/wallet-store";

interface Props {
  address: string;
}

export function FavoriteButton({ address }: Props) {
  const { addFavorite, removeFavorite, isFavorite } = useWalletStore();

  return (
    <TouchableOpacity
      onPress={() => {
        if (isFavorite(address)) {
          removeFavorite(address);
        } else {
          addFavorite(address);
        }
      }}
      style={styles.button}
    >
      <Ionicons
        name={isFavorite(address) ? "heart" : "heart-outline"}
        size={24}
        color={isFavorite(address) ? "#FF4545" : "#666"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
