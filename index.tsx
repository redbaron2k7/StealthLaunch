import { Notices } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";
import { Button, Text } from "@webpack/common";
import { ModalRoot, ModalContent, ModalFooter, ModalSize, openModal } from "@utils/modal";
import ErrorBoundary from "@components/ErrorBoundary";
import { findByCode } from "@webpack";

const settings = definePluginSettings({
    enableOnStartup: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Enable Stealth Launch on Discord startup"
    },
    autoOnlineDelay: {
        type: OptionType.NUMBER,
        default: 0,
        description: "Automatically go online after X minutes (0 to disable)"
    }
});

const styles = {
    modalContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: '20px',
    },
    emojiIcon: {
        fontSize: '72px',
        marginBottom: '20px',
    },
    messageText: {
        textAlign: 'center' as const,
        marginBottom: '20px',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 20px',
    }
};

async function updateStatus(newStatus: string, setStatus: Function ) {
    try {
        const analyticsContext = { location: { section: "Account Panel", object: "Avatar" } };
        await setStatus(newStatus, analyticsContext);
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

function StealthModal({ modalProps, setStatus }: { modalProps: any, setStatus: any }) {
    const handleStayInvisible = () => {
        modalProps.onClose();
    };

    const handleGoOnline = () => {
        updateStatus("online", setStatus);
        modalProps.onClose();
    };

    return (
        <ErrorBoundary>
            <ModalRoot {...modalProps} size={ModalSize.SMALL}>
                <ModalContent>
                    <div style={styles.modalContent}>
                        <div style={styles.emojiIcon}>🤫</div>
                        <Text variant="heading-lg/semibold" style={styles.messageText}>
                            Psst! You're Incognito
                        </Text>
                        <Text variant="text-md/normal" style={styles.messageText}>
                            Discord launched in stealth mode. Your status is set to invisible.
                            Would you like to remain undercover or make your presence known?
                        </Text>
                    </div>
                </ModalContent>
                <ModalFooter>
                    <div style={styles.modalFooter}>
                        <Button onClick={handleStayInvisible} color={Button.Colors.PRIMARY}>
                            Stay Invisible
                        </Button>
                        <Button onClick={handleGoOnline} color={Button.Colors.BRAND}>
                            Go Online
                        </Button>
                    </div>
                </ModalFooter>
            </ModalRoot>
        </ErrorBoundary>
    );
}

export default definePlugin({
    name: "StealthLaunch",
    description: "Launches Discord in Stealth Mode, making you offline on launch.",
    authors: [{ name: "redbaron2k7", id: 1142923640778797157n }],
    settings,

    start() {
        const setStatus = findByCode(".USER_STATUS_UPDATED");

        if (settings.store.enableOnStartup) {
            updateStatus("invisible", setStatus);
            openModal(props => <StealthModal modalProps={props} setStatus={setStatus} />);

            if (settings.store.autoOnlineDelay > 0) {
                this.autoOnlineTimeout = setTimeout(() => {
                    this.showGoOnlineNotice(setStatus);
                }, settings.store.autoOnlineDelay * 60000);
            }
        }
    },

    showGoOnlineNotice(setStatus: Function) {
        const goOnlineMessage = "Your stealth launch period has ended. Click the button to go online, or the X to stay invisible.";
        Notices.showNotice(goOnlineMessage, "Go Online", () => {
            Notices.popNotice();
            updateStatus("online", setStatus);
        });
    },

    stop() {
        if (this.autoOnlineTimeout) {
            clearTimeout(this.autoOnlineTimeout);
        }
    }
});
