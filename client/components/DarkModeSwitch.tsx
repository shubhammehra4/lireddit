import { useColorMode, Switch } from "@chakra-ui/react";

export const DarkModeSwitch = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const isDark = colorMode === "dark";
    return (
        <Switch
            mx={3}
            // position="fixed"
            // top="1rem"
            // right="1rem"
            color="green"
            isChecked={isDark}
            onChange={toggleColorMode}
        />
    );
};
