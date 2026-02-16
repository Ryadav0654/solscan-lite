import { FavoriteButton } from "@/src/components/FavoriteButton";
import { useWalletStore } from "@/src/stores/wallet-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// const RPC_URL = "https://api.mainnet-beta.solana.com";

const index = () => {
  const router = useRouter();
  const [address, setAddress] = useState<string>(""); //7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
  const [tokens, setTokens] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [txns, setTxns] = useState<any[]>([]);
  const { addToHistory, searchHistory, isDevnet, toggleNetwork } =
    useWalletStore();

  const RPC_URL = isDevnet
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

  const rpc = async (method: string, params: any[]) => {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: params,
      }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  };

  const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;

  const timeAgo = (ts: number) => {
    const s = Math.floor(Date.now() / 1000 - ts);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const getBalance = async (addr: string) => {
    const result = await rpc("getBalance", [addr]);
    return result.value / 1000_000_000;
  };

  const getTokens = async (addr: string) => {
    const result = await rpc("getTokenAccountsByOwner", [
      addr,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed" },
    ]);

    return (result.value || [])
      .map((a: any) => ({
        mint: a.account.data.parsed.info.mint,
        amount: a.account.data.parsed.info.tokenAmount.uiAmount,
      }))
      .filter((t: any) => t.amount > 0);
  };

  const getTxns = async (addr: string) => {
    const sigs = await rpc("getSignaturesForAddress", [addr, { limit: 10 }]);
    return sigs.map((s: any) => ({
      sig: s.signature,
      time: s.blockTime,
      ok: !s.err,
    }));
  };

  const tryExample = () => {
    const example = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    setAddress(example);
  };

  const search = async () => {
    const addr = address.trim();
    if (!addr) return Alert.alert("Enter a wallet address");

    setLoading(true);
    addToHistory(addr);
    try {
      const [bal, tok, tx] = await Promise.all([
        getBalance(addr),
        getTokens(addr),
        getTxns(addr),
      ]);
      setBalance(bal);
      setTokens(tok);
      setTxns(tx);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };
  const searchFromHistory = async (addr: string) => {
    setAddress(addr);
    setLoading(true);
    addToHistory(addr);
    try {
      const [bal, tok, tx] = await Promise.all([
        getBalance(addr),
        getTokens(addr),
        getTxns(addr),
      ]);
      setBalance(bal);
      setTokens(tok);
      setTxns(tx);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown Error";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={s.scroll}>
          <View style={s.header}>
            <View>
              <Text style={s.title}>SolScan</Text>
              <Text style={s.subtitle}>Explore any Solana wallet</Text>
            </View>
            <TouchableOpacity style={s.networkToggle} onPress={toggleNetwork}>
              <View style={[s.networkDot, isDevnet && s.networkDotDevnet]} />
              <Text style={s.networkText}>
                {isDevnet ? "Devnet" : "Mainnet"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Card */}
          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Enter wallet address"
              placeholderTextColor="#6B7280"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.button, loading && s.btnDisabled]}
              onPress={search}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={s.buttonText}>Search</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.btnGhost}
              onPress={tryExample}
              activeOpacity={0.7}
            >
              <Text style={s.btnGhostText}>Demo</Text>
            </TouchableOpacity>
          </View>

          {searchHistory.length > 0 && balance === null && (
            <View style={s.historySection}>
              <Text style={s.historyTitle}>Recent Searches</Text>
              {searchHistory.slice(0, 5).map((addr) => (
                <TouchableOpacity
                  key={addr}
                  style={s.historyItem}
                  onPress={() => searchFromHistory(addr)}
                >
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={s.historyAddress} numberOfLines={1}>
                    {short(addr, 8)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Balance Card */}
          {balance !== null && (
            <View style={s.balanceCard}>
              <View style={s.favoriteWrapper}>
                <FavoriteButton address={address.trim()} />
              </View>
              <Text style={s.label}>SOL Balance</Text>
              <View style={s.balanceRow}>
                <Text style={s.balance}>{balance.toFixed(4)}</Text>
                <Text style={s.sol}>SOL</Text>
              </View>
              <Text style={s.addr}>{short(address.trim(), 6)}</Text>
            </View>
          )}

          {tokens.length > 0 && (
            <>
              <Text style={s.section}>Tokens ({tokens.length})</Text>
              <FlatList
                data={tokens}
                keyExtractor={(t) => t.mint}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.row}
                    onPress={() => router.push(`/token/${item.mint}`)}
                  >
                    <Text style={s.mint}>{short(item.mint, 6)}</Text>
                    <Text style={s.amount}>{item.amount}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {/* Transactions */}
          {txns.length > 0 && (
            <>
              <Text style={s.section}>Recent Transactions</Text>
              <FlatList
                data={txns}
                keyExtractor={(t) => t.sig}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.row}
                    onPress={() =>
                      Linking.openURL(`https://solscan.io/tx/${item.sig}`)
                    }
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={s.mint}>{short(item.sig, 8)}</Text>
                      <Text style={s.time}>
                        {item.time ? timeAgo(item.time) : "pending"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        s.statusIcon,
                        { color: item.ok ? "#14F195" : "#EF4444" },
                      ]}
                    >
                      {item.ok ? "Success" : "Failed"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default index;

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0D12",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
  },
  networkToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16161D",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A35",
    gap: 6,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#14F195",
  },
  networkDotDevnet: {
    backgroundColor: "#F59E0B",
  },
  networkText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  historySection: {
    marginTop: 24,
  },
  historyTitle: {
    color: "#6B7280",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16161D",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A35",
    gap: 12,
  },
  historyAddress: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
  },

  /* Input Card */
  card: {
    backgroundColor: "#12172A",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },

  inputContainer: {
    backgroundColor: "#16161D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A35",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 14,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    backgroundColor: "#14F195",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#14F195",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },

  btnGhost: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#16161D",
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  btnGhostText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "500",
  },
  balanceCard: {
    backgroundColor: "#16161D",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  favoriteWrapper: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  label: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  sol: {
    color: "#14F195",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  addr: {
    color: "#9945FF",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 16,
    backgroundColor: "#1E1E28",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },

  section: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 32,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#16161D",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A35",
  },
  mint: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  amount: {
    color: "#14F195",
    fontSize: 15,
    fontWeight: "600",
  },
  time: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "400",
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: "400",
  },
});
