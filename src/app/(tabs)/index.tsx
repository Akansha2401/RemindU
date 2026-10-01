import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

const Home = () => {
  return (
    <SafeAreaView className="flex-1 bg-background px-4">
      <Text className="mb-6 text-2xl font-bold">Home</Text>

      <Link href="/limits/new" asChild>
        <Button className="mb-3">
          <Text>New app limit</Text>
        </Button>
      </Link>
      <Link href="/limits/permissions" asChild>
        <Button variant="outline">
          <Text>Limiter permissions</Text>
        </Button>
      </Link>
    </SafeAreaView>
  );
};

export default Home;
