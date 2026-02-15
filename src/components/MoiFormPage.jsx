/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import DenominationModal from './DenominationModal';
import EditEntryModal from './EditEntryModal';
import EditAmountModal from './EditAmountModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ExpenseModal from './ExpenseModal';
import ChangeModal from './ChangeModal';
import ShortcutsManager from './ShortcutsManager';
import { createPosBillPrintAssets, printMoiReceipt, sendImageToPrinter } from '../lib/printUtils.jsx';
import { MoiBookIcon } from './MoiBookLogo';
import { expandShortcut, getShortcutSuggestion, getAllShortcuts, autoCorrectTownName, processTownInput, expandShortcutOnSpace } from '../lib/townShortcuts';
import { expandNameShortcut, getNameSuggestion } from '../lib/nameShortcuts';
import { expandRelationshipShortcut, getRelationshipSuggestion } from '../lib/relationshipShortcuts';
import { expandAmountShortcut, getAmountSuggestion, autoFormatAmount } from '../lib/amountShortcuts';

const initialFormState = {
    memberId: '',
    townId: '',
    street: '',
    initial: '',
    name: '',
    relationshipType: 'son',
    relationshipName: '',
    isMaternalUncle: false,
    education: '',
    profession: '',
    phone: '',
    note: '',
    amount: '',
};

const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const SearchableComboBox = ({ options, value, onValueChange, onOptionSelect, placeholder, enableShortcuts, shortcutExpander, onBlur }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const componentRef = useRef(null);
    const inputRef = useRef(null);

    const filteredOptions = useMemo(() => {
        if (!value) return options;
        return options.filter(o => o.name.toLowerCase().includes(value.toLowerCase()));
    }, [value, options]);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (componentRef.current && !componentRef.current.contains(e.target)) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset selected index when filtered options change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [filteredOptions]);

    const handleKeyDown = (e) => {
        // Handle shortcuts on Space if enabled and no dropdown is showing
        if (enableShortcuts && shortcutExpander && e.key === ' ' && (!isOpen || filteredOptions.length === 0)) {
            const expanded = shortcutExpander(value);
            if (expanded !== value) {
                e.preventDefault();
                onValueChange(expanded);
                setIsOpen(false);
                return;
            }
        }

        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setIsOpen(true);
            return;
        }

        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
                    onOptionSelect(filteredOptions[selectedIndex]);
                    setIsOpen(false);
                    setSelectedIndex(-1);
                }
                break;
            case 'Tab':
                // Handle shortcuts on Tab if enabled
                if (enableShortcuts && shortcutExpander && (!filteredOptions.length || selectedIndex < 0)) {
                    const expanded = shortcutExpander(value);
                    if (expanded !== value) {
                        e.preventDefault();
                        onValueChange(expanded);
                        setIsOpen(false);
                        setSelectedIndex(-1);
                        return;
                    }
                }
                
                // Allow tab to select highlighted option
                if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
                    e.preventDefault();
                    onOptionSelect(filteredOptions[selectedIndex]);
                }
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    // Scroll to selected item
    useEffect(() => {
        if (selectedIndex >= 0) {
            const listElement = componentRef.current?.querySelector('.searchable-dropdown-list');
            const selectedElement = listElement?.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    return (
        <div className="searchable-dropdown" ref={componentRef}>
            <input
                ref={inputRef}
                type="text"
                className="searchable-dropdown-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={(e) => {
                    // Call parent's onBlur if provided
                    if (onBlur) {
                        onBlur(e);
                    }
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && (
                <div className="searchable-dropdown-list">
                    {filteredOptions.map((option, index) => (
                        <div 
                            key={option.id} 
                            className={`searchable-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => {
                                onOptionSelect(option);
                                setIsOpen(false);
                                setSelectedIndex(-1);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {option.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function MoiFormPage({ event, loggedInTable, onBack, onLogout, onNavigateToMoiDetails, moiEntries, addMoiEntry, updateMoiEntry, deleteMoiEntry, updatePinUsage, towns, people, settings = {}, setSettings }) {
    const [formData, setFormData] = useState(initialFormState);
    const [isDenominationModalOpen, setIsDenominationModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
    const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false); // New state for shortcuts help
    const [isShortcutsManagerOpen, setIsShortcutsManagerOpen] = useState(false); // State for shortcuts manager
    const [townInputValue, setTownInputValue] = useState('');
    const [townShortcutHint, setTownShortcutHint] = useState(''); // Shortcut hint display
    const [nameShortcutHint, setNameShortcutHint] = useState(''); // Name shortcut hint
    const [relationshipShortcutHint, setRelationshipShortcutHint] = useState(''); // Relationship shortcut hint
    const [amountShortcutHint, setAmountShortcutHint] = useState(''); // Amount shortcut hint
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSearchStatus, setMemberSearchStatus] = useState(''); // '' | 'found' | 'not-found'
    const [isQrScanOpen, setIsQrScanOpen] = useState(false);
    const [qrScanError, setQrScanError] = useState('');
    const [activeTab, setActiveTab] = useState('form'); // 'form' | 'qr'
    const [qrListEntries, setQrListEntries] = useState([]);
    const [lastQrScanInfo, setLastQrScanInfo] = useState(null);
    const [currentInputLanguage, setCurrentInputLanguage] = useState('unknown'); // 'english', 'tamil', or 'unknown'
    const [focusedField, setFocusedField] = useState(''); // Track which field is focused
    const [showKeyboardSwitchAlert, setShowKeyboardSwitchAlert] = useState(false);
    const [requiredKeyboardMode, setRequiredKeyboardMode] = useState(''); // 'tamil' or 'english'
    const [cardState, setCardState] = useState(null);
    const [isCardSending, setIsCardSending] = useState(false);
    const amountInputRef = useRef(null);
    const phoneInputRef = useRef(null);
    const memberIdInputRef = useRef(null);
    const qrScannerRef = useRef(null);
    const qrReaderIdRef = useRef(`moi-qr-reader-${Math.random().toString(36).slice(2)}`);
    const cardRef = useRef(null);
    const qrListStorageKey = useMemo(() => {
        const eventKey = event?.id ? String(event.id) : 'default';
        return `moi-qr-list:${eventKey}`;
    }, [event?.id]);
    
    // State for modals
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');

    const getEntrySerialNumber = (entry, fallback) => {
        const raw = entry?.serialNumber ?? entry?.serial ?? entry?.entryNumber ?? null;
        const parsed = raw != null ? parseInt(raw, 10) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
        if (Number.isFinite(fallback) && fallback > 0) {
            return fallback;
        }
        return null;
    };

    const formatSerialNumber = (value) => {
        const parsed = value != null ? parseInt(value, 10) : NaN;
        if (!Number.isFinite(parsed)) return '';
        return parsed.toString().padStart(4, '0');
    };

    const isMemberWhatsappEnabled = settings?.memberCardWhatsappEnabled !== false;
    const handleMemberWhatsappToggle = () => {
        if (typeof setSettings !== 'function') return;
        setSettings({
            ...settings,
            memberCardWhatsappEnabled: !isMemberWhatsappEnabled
        });
    };

    const buildMemberQrPayload = (member) => {
        return JSON.stringify({
            memberCode: member.memberCode || member.memberId || '',
            name: member.fullName || member.baseName || '',
            phone: member.phone || '',
            town: member.town || ''
        });
    };

    const openWhatsAppChat = (phoneDigits, message) => {
        const appUrl = `whatsapp://send?phone=${phoneDigits}&text=${message}`;
        const webUrl = `https://wa.me/${phoneDigits}?text=${message}`;
        try {
            window.location.href = appUrl;
        } catch (err) {
            console.warn('WhatsApp app open failed', err);
        }
        setTimeout(() => {
            window.open(webUrl, '_blank', 'noopener');
        }, 600);
    };

    const sendMemberIdCardWhatsApp = async (memberData) => {
        if (isCardSending) return;
        if (settings?.memberCardWhatsappEnabled === false) return;
        if (!memberData?.phone) return;

        const digits = String(memberData.phone).replace(/\D/g, '');
        if (!digits) return;
        const phoneDigits = digits.length === 10 ? `91${digits}` : digits;

        setIsCardSending(true);
        try {
            const qrPayload = buildMemberQrPayload(memberData);
            const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 256, margin: 1 });
            setCardState({ member: memberData, qrDataUrl });
            await new Promise(resolve => setTimeout(resolve, 120));

            const node = cardRef.current;
            if (!node) throw new Error('ID card render failed');
            const imageData = await toPng(node, { cacheBust: true, pixelRatio: 2 });

            const blob = await (await fetch(imageData)).blob();
            const safeCode = memberData.memberCode || memberData.memberId || 'member';
            const file = new File([blob], `ID_${safeCode}.png`, { type: 'image/png' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ID_${safeCode}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            const orgPhone = settings?.billHeaderPhone || '';
            const messageText = `வணக்கம்! நீங்கள் MoiBook‑ல் உறுப்பினராக சேர்ந்ததற்கு நன்றி. உங்கள் Member ID Card இணைக்கப்பட்டுள்ளது. தொடர்ந்து உங்கள் ஆதரவு தருமாறு கேட்டுக்கொள்கிறோம். 🙏\nஉங்கள் வீட்டின் விழாவிற்கு எங்களை தொடர்பு கொள்ள ${orgPhone || 'நிறுவண தொலைபேசி எண்'}.`;
            const message = encodeURIComponent(messageText);
            openWhatsAppChat(phoneDigits, message);
        } catch (err) {
            console.error('Failed to share ID card:', err);
        } finally {
            setIsCardSending(false);
            setCardState(null);
        }
    };

    const getNextSerialNumber = (entries, serialMap) => {
        const serials = entries
            .map(entry => {
                const existing = getEntrySerialNumber(entry);
                if (Number.isFinite(existing)) return existing;
                const mapped = serialMap ? serialMap.get(entry) : null;
                return Number.isFinite(mapped) ? mapped : null;
            })
            .filter(num => Number.isFinite(num));
        if (serials.length > 0) {
            return Math.max(...serials) + 1;
        }
        return entries.length + 1;
    };

    const withSerialNumber = (entry, serialNumber) => {
        if (!entry || serialNumber == null) return entry;
        const formatted = formatSerialNumber(serialNumber);
        if (!formatted || entry.serialNumber === formatted) return entry;
        return { ...entry, serialNumber: formatted };
    };

    const triggerReceiptPrint = async (entryToPrint) => {
        if (!entryToPrint || !event) {
            return;
        }

        const tableKey = (loggedInTable || '').trim();
        const assignment = tableKey && settings?.printerAssignments
            ? settings.printerAssignments[tableKey]
            : null;
        const printerName = assignment && typeof assignment.printer === 'string'
            ? assignment.printer.trim()
            : '';

        console.log('🖨️ Print Debug:', {
            tableKey,
            hasSettings: !!settings,
            hasPrinterAssignments: !!settings?.printerAssignments,
            assignment,
            printerName,
            allAssignments: settings?.printerAssignments
        });

        if (!printerName) {
            console.warn('⚠️ No printer configured, falling back to browser print dialog');
            printMoiReceipt(entryToPrint, event);
            return;
        }

        const parsedCount = parseInt(assignment?.count, 10);
        const copyCount = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 5) : 1;

        try {
            const { imageBlob, pdfBase64, mimeType } = await createPosBillPrintAssets(entryToPrint, event);
            for (let index = 0; index < copyCount; index += 1) {
                const jobLabelSegments = [
                    'MoiBook',
                    event?.id || null,
                    tableKey || null,
                    entryToPrint?.id || null,
                    copyCount > 1 ? `copy${index + 1}` : null
                ].filter(Boolean);
                const jobLabel = jobLabelSegments.length ? jobLabelSegments.join('-') : null;

                await sendImageToPrinter({
                    printerName,
                    imageBlob,
                    pdfBase64,
                    mimeType,
                    jobLabel
                });
            }
        } catch (error) {
            console.error('Direct POS print failed, falling back to browser print', error);
            const details = [];
            if (error?.message) {
                details.push(error.message);
            }
            if (error?.details) {
                details.push(error.details);
            }
            const friendlyMessage = details.length ? `\n\n${details.join('\n')}` : '';
            alert(`Direct printer-க்கு அனுப்ப முடியவில்லை.${friendlyMessage}\n\nBrowser print திறக்கப்படுகிறது.`);
            printMoiReceipt(entryToPrint, event);
        }
    };

    const stopQrScanner = () => {
        const scanner = qrScannerRef.current;
        if (!scanner) return;
        try {
            const maybePromise = scanner.stop();
            Promise.resolve(maybePromise)
                .then(() => scanner.clear())
                .catch(() => {})
                .finally(() => {
                    qrScannerRef.current = null;
                });
        } catch (err) {
            qrScannerRef.current = null;
        }
    };

    const persistQrList = (entries) => {
        try {
            localStorage.setItem(qrListStorageKey, JSON.stringify(entries));
        } catch (err) {
            console.warn('QR list save failed', err);
        }
    };

    const formatQrTimestamp = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value);
        return parsed.toLocaleString('en-GB');
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem(qrListStorageKey);
            setQrListEntries(stored ? JSON.parse(stored) : []);
        } catch (err) {
            console.warn('QR list load failed', err);
            setQrListEntries([]);
        }
    }, [qrListStorageKey]);

    const applyQrPayload = (payload) => {
        if (!payload) return;
        if (typeof payload === 'string') {
            const cleaned = payload.trim();
            if (cleaned) {
                setFormData(prev => ({ ...prev, memberId: cleaned }));
                memberIdInputRef.current?.focus();
            }
            return;
        }

        const memberCode = payload.memberCode || payload.memberId || payload.member_id || '';
        const name = payload.name || payload.fullName || payload.full_name || payload.baseName || '';
        const phone = payload.phone || '';
        const town = payload.town || '';

        setFormData(prev => ({
            ...prev,
            memberId: memberCode || prev.memberId,
            name: name || prev.name,
            phone: phone || prev.phone
        }));

        if (town) {
            setTownInputValue(town);
            setTownShortcutHint('');
        }

        memberIdInputRef.current?.focus();
    };

    useEffect(() => {
        if (!isQrScanOpen) {
            stopQrScanner();
            return;
        }

        const readerId = qrReaderIdRef.current;
        setQrScanError('');
        const scanner = new Html5Qrcode(readerId);
        qrScannerRef.current = scanner;

        const startTimer = setTimeout(() => {
            scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decodedText) => {
                    if (!decodedText) return;
                    const scannedAt = new Date().toISOString();
                    setLastQrScanInfo({ raw: decodedText, scannedAt });
                    let payload = null;
                    try {
                        payload = JSON.parse(decodedText);
                    } catch (err) {
                        payload = decodedText;
                    }
                    applyQrPayload(payload);
                    setIsQrScanOpen(false);
                },
                () => {}
            ).catch((err) => {
                console.error('QR scan start failed', err);
                setQrScanError('Camera access முடியவில்லை. HTTPS அல்லது browser permissions சரிபார்க்கவும்.');
            });
        }, 0);

        return () => {
            clearTimeout(startTimer);
            stopQrScanner();
        };
    }, [isQrScanOpen]);

    // Prefill from URL (supports ?prefill=BASE64 or fragment #d=BASE64)
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const params = new URLSearchParams(window.location.search);
            const pre = params.get('prefill');
            if (pre) {
                try {
                    const decoded = JSON.parse(atob(pre));
                    applyQrPayload(decoded);
                    // remove query param to avoid reuse
                    const url = new URL(window.location.href);
                    url.searchParams.delete('prefill');
                    window.history.replaceState(null, '', url.toString());
                    return;
                } catch (e) {
                    console.error('prefill parse error', e);
                }
            }

            const frag = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
            if (frag) {
                const fragParams = new URLSearchParams(frag);
                const d = fragParams.get('d');
                if (d) {
                    try {
                        const decoded = JSON.parse(atob(d));
                        applyQrPayload(decoded);
                        // clear hash
                        history.replaceState(null, '', window.location.pathname + window.location.search);
                    } catch (e) {
                        console.error('fragment prefill parse error', e);
                    }
                }
            }
        } catch (err) {
            console.error('prefill handler error', err);
        }
    }, []);

    // Open QR scanner from URL (supports ?scan=1 or fragment #scan=1)
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const params = new URLSearchParams(window.location.search);
            const scan = params.get('scan');
            if (scan === '1' || scan === 'true') {
                setIsQrScanOpen(true);
                const url = new URL(window.location.href);
                url.searchParams.delete('scan');
                window.history.replaceState(null, '', url.toString());
                return;
            }
            const frag = window.location.hash ? window.location.hash.slice(1) : '';
            if (frag) {
                const fragParams = new URLSearchParams(frag);
                const scanFrag = fragParams.get('scan');
                if (scanFrag === '1' || scanFrag === 'true') {
                    setIsQrScanOpen(true);
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            }
        } catch (err) {
            console.error('scan open handler error', err);
        }
    }, []);

    // Helper function to check if field requires specific keyboard mode
    const getRequiredKeyboardMode = (fieldName) => {
        // Tamil fields - require Tamil keyboard
        const tamilFields = ['name', 'relationshipName', 'profession', 'street', 'note'];
        if (tamilFields.includes(fieldName) || fieldName === 'townInput') {
            return 'tamil';
        }
        
        // English fields - require English keyboard
        const englishFields = ['education'];
        if (englishFields.includes(fieldName)) {
            return 'english';
        }
        
        // Mixed or no preference
        return 'mixed';
    };

    // Handle field focus with keyboard mode suggestion
    const handleFieldFocus = (fieldName) => {
        setFocusedField(fieldName);
        const required = getRequiredKeyboardMode(fieldName);
        setRequiredKeyboardMode(required);
        
        // If field has specific requirement and user is in wrong mode, show alert
        if (required === 'tamil' && currentInputLanguage === 'english') {
            setShowKeyboardSwitchAlert(true);
            setTimeout(() => setShowKeyboardSwitchAlert(false), 3000); // Auto-hide after 3s
        } else if (required === 'english' && currentInputLanguage === 'tamil') {
            setShowKeyboardSwitchAlert(true);
            setTimeout(() => setShowKeyboardSwitchAlert(false), 3000);
        }
    };

    const handleFieldBlur = () => {
        setFocusedField('');
        setRequiredKeyboardMode('');
        setShowKeyboardSwitchAlert(false);
    };

    // Generate unique town list from ALL events' database entries for auto-complete
    // This allows cross-event town auto-fill (Event 1 towns appear in Event 2, etc.)
    // MUST BE DECLARED BEFORE useEffect that depends on it!
    const filteredTowns = useMemo(() => {
        // Get all unique towns from ALL moiEntries (cross-event)
        const uniqueTowns = [];
        const seenTowns = new Set();
        
        // Extract unique towns from database
        moiEntries.forEach(entry => {
            if (!entry.town) return; // Skip entries without town
            
            // Use town name as key (townId might be empty for custom towns)
            const townKey = entry.town;
            
            if (!seenTowns.has(townKey)) {
                seenTowns.add(townKey);
                // Generate a unique ID if townId is empty
                const townIdValue = entry.townId || `custom-${uniqueTowns.length + 1}`;
                uniqueTowns.push({
                    id: townIdValue,
                    name: entry.town
                });
            }
        });
        
        // Merge with static towns array for backward compatibility
        // Only add static towns that don't already exist in database
        const staticTowns = towns.filter(t => !uniqueTowns.some(ut => ut.name === t.name));
        
        return [...uniqueTowns, ...staticTowns];
    }, [moiEntries, towns]);

    // Sync town input value when formData.townId changes
    useEffect(() => {
      // Check both filteredTowns (database + static) and moiEntries for town lookup
      const selectedTown = filteredTowns.find(t => t.id === formData.townId);
      if (selectedTown) {
          setTownInputValue(selectedTown.name);
      } else if (formData.townId) {
          // Fallback: Search in moiEntries for custom towns without proper ID
          const entryWithTown = moiEntries.find(entry => entry.townId === formData.townId);
          setTownInputValue(entryWithTown ? entryWithTown.town : '');
      } else {
          setTownInputValue('');
      }
    }, [formData.townId, filteredTowns, moiEntries]);

    // Search for person by memberId or phone number in PREVIOUS moi entries (ACROSS ALL EVENTS)
    useEffect(() => {
        if (formData.memberId && formData.memberId.length >= 3) {
            const searchValue = formData.memberId.toLowerCase();
            // If user types only numbers (e.g., "0008"), also try with "UR-" prefix
            const searchValueWithPrefix = /^\d+$/.test(formData.memberId) 
                ? `ur-${formData.memberId}` 
                : searchValue;
            
            // Search in ALL moi entries (across all events) for matching memberId or phone
            // This allows finding members who attended previous events
            const foundEntry = moiEntries.find(entry => 
                entry.memberId?.toLowerCase() === searchValue ||
                entry.memberId?.toLowerCase() === searchValueWithPrefix ||
                entry.phone === formData.memberId
            );

            if (foundEntry) {
                // Auto-fill the form with found entry's details
                // Use filteredTowns (database + static) instead of static towns array
                const town = filteredTowns.find(t => t.id === foundEntry.townId);
                setFormData(prev => ({
                    ...prev,
                    memberId: foundEntry.memberId, // PRESERVE the original memberId
                    townId: foundEntry.townId || '',
                    name: foundEntry.baseName || foundEntry.name || '',
                    initial: foundEntry.initial || '',
                    phone: foundEntry.phone || '',
                    education: foundEntry.education || '',
                    profession: foundEntry.profession || '',
                    street: foundEntry.street || '',
                    relationshipName: foundEntry.relationshipName || '',
                    relationshipType: foundEntry.relationshipType || 'son',
                }));
                if (town) {
                    setTownInputValue(town.name);
                } else if (foundEntry.town) {
                    // Fallback: Use the town name from the entry directly
                    setTownInputValue(foundEntry.town);
                }
                setMemberSearchStatus('found');
            } else {
                // Show "not found" message
                setMemberSearchStatus('not-found');
            }
        } else {
            // Clear status if less than 3 characters
            setMemberSearchStatus('');
        }
    }, [formData.memberId, moiEntries, filteredTowns]);

    // Update shortcut hints as user types
    useEffect(() => {
        // Name shortcut hint
        if (formData.name) {
            const hint = getNameSuggestion(formData.name);
            setNameShortcutHint(hint);
        } else {
            setNameShortcutHint('');
        }
    }, [formData.name]);

    useEffect(() => {
        // Relationship shortcut hint
        if (formData.relationshipName) {
            const hint = getRelationshipSuggestion(formData.relationshipName);
            setRelationshipShortcutHint(hint);
        } else {
            setRelationshipShortcutHint('');
        }
    }, [formData.relationshipName]);

    useEffect(() => {
        // Amount shortcut hint
        if (formData.amount) {
            const hint = getAmountSuggestion(formData.amount);
            setAmountShortcutHint(hint);
        } else {
            setAmountShortcutHint('');
        }
    }, [formData.amount]);


    // Generate unique name list from ALL events' database entries for auto-complete
    // This allows cross-event name auto-fill (Event 1 names appear in Event 2, etc.)
    const filteredPeople = useMemo(() => {
        // Get all unique people from ALL moiEntries (cross-event)
        const uniquePeople = [];
        const seenNames = new Set();
        
        // DON'T filter by eventId - we want names from ALL events!
        // Only filter by townId if selected
        const townFilteredEntries = formData.townId 
            ? moiEntries.filter(entry => entry.townId === formData.townId)
            : moiEntries;
        
        // Extract unique people based on name + phone combination
        townFilteredEntries.forEach(entry => {
            if (!entry.baseName && !entry.name) return; // Skip entries without name
            
            const nameKey = `${entry.baseName || entry.name}_${entry.phone || ''}`;
            
            if (!seenNames.has(nameKey)) {
                seenNames.add(nameKey);
                uniquePeople.push({
                    id: entry.memberId || entry.id,
                    townId: entry.townId,
                    name: entry.baseName || entry.name,
                    initial: entry.initial || '',
                    phone: entry.phone || '',
                    education: entry.education || '',
                    profession: entry.profession || '',
                    street: entry.street || '',
                    relationshipName: entry.relationshipName || '',
                    relationshipType: entry.relationshipType || 'son',
                    memberId: entry.memberId
                });
            }
        });
        
        return uniquePeople;
    }, [formData.townId, moiEntries]);

    const eventEntries = useMemo(() => (
        // CRITICAL: Filter by eventId FIRST to prevent cross-event data leakage
        moiEntries.filter(entry => entry.eventId === event.id)
    ), [moiEntries, event.id]);

    const eventSerialMap = useMemo(() => {
        const map = new Map();
        const sorted = [...eventEntries].sort((a, b) => {
            const aSerial = getEntrySerialNumber(a);
            const bSerial = getEntrySerialNumber(b);
            if (Number.isFinite(aSerial) && Number.isFinite(bSerial)) {
                return aSerial - bSerial;
            }
            const aKey = Number.isFinite(aSerial) ? aSerial : (parseInt(a?.id, 10) || 0);
            const bKey = Number.isFinite(bSerial) ? bSerial : (parseInt(b?.id, 10) || 0);
            return aKey - bKey;
        });
        let seq = 1;
        for (const entry of sorted) {
            if (getEntrySerialNumber(entry) == null) {
                map.set(entry, seq);
            }
            seq += 1;
        }
        return map;
    }, [eventEntries]);

    const resolveSerialNumber = (entry) => {
        const existing = getEntrySerialNumber(entry);
        if (Number.isFinite(existing)) return existing;
        const mapped = eventSerialMap.get(entry);
        if (Number.isFinite(mapped)) return mapped;
        return null;
    };

    const filteredMoiEntries = useMemo(() => {
        let entries = [...eventEntries];
        
        // Then filter by logged in table
        if (loggedInTable) {
            entries = entries.filter(entry => entry.table === loggedInTable);
        }
        
        // Apply search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            entries = entries.filter(entry =>
                entry.id.toLowerCase().includes(lowercasedQuery) ||
                (entry.memberId && entry.memberId.toLowerCase().includes(lowercasedQuery)) ||
                entry.town.toLowerCase().includes(lowercasedQuery) ||
                entry.name.toLowerCase().includes(lowercasedQuery) ||
                (entry.phone && entry.phone.includes(lowercasedQuery)) ||
                Math.abs(entry.amount).toString().includes(lowercasedQuery)
            );
        }
        
        // IMPORTANT: Reverse order - newest entries first (top of table)
        return entries.reverse();
    }, [searchQuery, eventEntries, loggedInTable]);
    
    const handleClearForm = () => {
        setFormData(initialFormState);
        setTownInputValue('');
        setMemberSearchStatus('');
        setLastQrScanInfo(null);
        memberIdInputRef.current?.focus();
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;

        // Detect input language based on character type
        if (value) {
            const lastChar = value.slice(-1);
            if (/[\u0B80-\u0BFF]/.test(lastChar)) {
                // Tamil Unicode range detected
                setCurrentInputLanguage('tamil');
            } else if (/[a-zA-Z]/.test(lastChar)) {
                // English letter detected
                setCurrentInputLanguage('english');
            }
        }

        // Apply specific formatting/validation
        if (name === 'phone' || name === 'memberId') {
            finalValue = finalValue.replace(/[^0-9]/g, '');
            if (name === 'phone' && finalValue.length > 10) return;
        } else if (name === 'amount') {
            // Allow numbers and 'k', 'l' for shortcuts (1k, 5k, 1l, etc.)
            finalValue = finalValue.replace(/[^0-9kl.]/gi, '');
        } else if (name === 'education') {
            finalValue = finalValue.replace(/[^a-zA-Z\s.]/g, '');
        } else if (name === 'initial') {
            // Allow up to 5 English, Tamil, or dot characters for initials.
            const sanitized = value.replace(/[^a-zA-Z\u0B80-\u0BFF.]/g, '');
            // `toUpperCase` works for English and doesn't affect Tamil.
            finalValue = sanitized.slice(0, 5).toUpperCase();
        }

        setFormData(prev => {
            const newState = { ...prev, [name]: finalValue };

            // If parent name is being cleared, also reset relationship type
            if (name === 'relationshipName' && !finalValue) {
                newState.relationshipType = 'son'; // Reset to default
            }

            return newState;
        });

        // Update hints for shortcuts
        if (name === 'relationshipName') {
            const hint = getRelationshipSuggestion(finalValue);
            setRelationshipShortcutHint(hint || '');
        }
    };

    const handlePhoneBlur = () => {
        if (formData.phone && formData.phone.length !== 10) {
            alert('தொலைபேசி எண் சரியாக 10 இலக்க எண்ணாக இருக்க வேண்டும்.');
            phoneInputRef.current?.focus();
        }
    };
    
    const handleNameOptionSelect = (person) => {
        setFormData(p => ({
            ...p,
            name: person.name,
            initial: person.initial || '',
            phone: person.phone || '',
            education: person.education || '',
            profession: person.profession || '',
        }));
    };

    const normalizeDenominationPayload = (payload) => {
        if (!payload) {
            return { netDenominations: null, receivedDenominations: null, givenDenominations: null };
        }
        if (payload.netDenominations || payload.receivedDenominations || payload.givenDenominations) {
            return {
                netDenominations: payload.netDenominations || payload.denominations || null,
                receivedDenominations: payload.receivedDenominations || null,
                givenDenominations: payload.givenDenominations || null
            };
        }
        if (typeof payload === 'object') {
            return {
                netDenominations: payload,
                receivedDenominations: payload,
                givenDenominations: null
            };
        }
        return { netDenominations: null, receivedDenominations: null, givenDenominations: null };
    };
    
    const handleSave = async (denominationData) => {
       // CRITICAL VALIDATION: Town and Name are mandatory
       if (!formData.townId && !townInputValue) {
           alert('⚠️ ஊர் பெயர் அவசியம் தேவை! தயவுசெய்து ஊர் பெயரை உள்ளிடவும்.');
           return; // Stop the save process
       }
       
       if (!formData.name || formData.name.trim() === '') {
           alert('⚠️ பெயர் அவசியம் தேவை! தயவுசெய்து பெயரை உள்ளிடவும்.');
           return; // Stop the save process
       }
       
       // Validate phone number: if it's not empty, it must be 10 digits
       if (formData.phone && formData.phone.length !== 10) {
           alert('தொலைபேசி எண் 10 இலக்க எண்ணாக இருக்க வேண்டும்.');
           return; // Stop the save process
       }
        
    // CRITICAL: Calculate next serial number from current event's entries only
    const eventEntries = moiEntries.filter(entry => entry.eventId === event.id);
    const nextSerialNumber = getNextSerialNumber(eventEntries, eventSerialMap);
    const newId = formatSerialNumber(nextSerialNumber);
       const townName = towns.find(t => t.id === formData.townId)?.name || townInputValue;

    // DUPLICATE CHECK: Prevent same name from being added twice within the event (across all tables/towns)
       const fullName = `${formData.initial ? formData.initial + (formData.initial.endsWith('.') ? '' : '.') : ''} ${formData.name}`.trim();
       const normalizedFullName = fullName.trim().toLowerCase();
       
       const isDuplicate = eventEntries.some(entry => {
           if (entry.type === 'expense' || entry.type === 'change') {
               return false;
           }
           const existingName = (entry.name || '').trim().toLowerCase();
           return existingName === normalizedFullName;
       });
       
       if (isDuplicate) {
           alert(`⚠️ Duplicate Entry / ஒரே மாதிரியான பதிவு!\n\nபெயர்: ${fullName}\n\nஇந்த பெயர் இந்த விழாவில் ஏற்கனவே உள்ளது. மறுபடியும் add பண்ண முடியாது.\n\n⚠️ Same name already exists in this event!`);
           return; // Stop the save process
       }

       // DUPLICATE PHONE CHECK: Prevent same phone from being used for a different name
       if (formData.phone) {
           const existingPhoneEntry = moiEntries.find(entry => {
               if (!entry || entry.type === 'expense' || entry.type === 'change') return false;
               const entryPhone = String(entry.phone || '').trim();
               if (!entryPhone) return false;
               return entryPhone === formData.phone.trim();
           });

           if (existingPhoneEntry) {
               const existingName = (existingPhoneEntry.name || existingPhoneEntry.baseName || '').trim().toLowerCase();
               if (existingName && existingName !== normalizedFullName) {
                   const existingMemberId = existingPhoneEntry.memberId || existingPhoneEntry.memberCode || '';
                   alert(`⚠️ இந்த mobile number வேறு பெயரில் ஏற்கனவே பதிவு உள்ளது!\n\nMobile: ${formData.phone}\nExisting: ${existingPhoneEntry.name || existingPhoneEntry.baseName}\nMember ID: ${existingMemberId || '-'}\n\nஇதே number‑க்கு புதிய பெயர் பதிவு செய்ய முடியாது.`);
                   return;
               }
           }
       }

       // Generate UNIQUE memberId across ALL events
       // If user manually entered memberId, use it
       // Otherwise, generate a globally unique ID based on total entries across all events
       let finalMemberId = formData.memberId;
       if (!finalMemberId) {
           // Find the highest memberId across ALL events (not just current event)
           const allMemberIds = moiEntries
               .map(entry => entry.memberId)
               .filter(id => id && id.startsWith('UR-'))
               .map(id => parseInt(id.replace('UR-', ''), 10))
               .filter(num => !isNaN(num));
           
           const nextMemberId = allMemberIds.length > 0 
               ? Math.max(...allMemberIds) + 1 
               : 1;
           
           finalMemberId = `UR-${nextMemberId.toString().padStart(6, '0')}`;
       }

    const { netDenominations, receivedDenominations, givenDenominations } = normalizeDenominationPayload(denominationData);

    const newEntry = {
     id: newId,
     serialNumber: newId,
        eventId: event.id, // CRITICAL: Add eventId for proper event isolation
        table: loggedInTable,
        town: townName,
        townId: formData.townId,
        street: formData.street,
        initial: formData.initial,
        baseName: formData.name, // Store base name for editing
        name: `${formData.initial ? formData.initial + (formData.initial.endsWith('.') ? '' : '.') : ''} ${formData.name}`,
        relationshipName: formData.relationshipName,
        parentName: formData.relationshipName, // Add parentName for bill
        relationshipType: formData.relationshipType,
        relationship: formData.relationshipName ? `${formData.relationshipName} ${formData.relationshipType === 'son' ? 'மகன்' : 'மகள்'}` : '',
        education: formData.education,
        profession: formData.profession,
        phone: formData.phone,
        note: formData.note,
        memberId: finalMemberId, // Use globally unique memberId
        amount: parseFloat(formData.amount),
        isMaternalUncle: formData.isMaternalUncle,
        denominations: netDenominations,
        receivedDenominations,
        givenDenominations,
       };
       
       await addMoiEntry(newEntry);
       if (formData.phone && formData.phone.length === 10) {
           const memberForCard = {
               memberCode: finalMemberId,
               memberId: finalMemberId,
               fullName: fullName,
               baseName: formData.name,
               phone: formData.phone,
               town: townName,
               education: formData.education,
               relationship: formData.relationshipName
           };
           await sendMemberIdCardWhatsApp(memberForCard);
       }
       setIsDenominationModalOpen(false);
       try {
           await triggerReceiptPrint(newEntry);
       } finally {
           handleClearForm();
       }
    };

    const handleAddToQrList = () => {
        if (!formData.townId && !townInputValue) {
            alert('âš ï¸ à®Šà®°à¯ à®ªà¯†à®¯à®°à¯ à®…à®µà®šà®¿à®¯à®®à¯ à®¤à¯‡à®µà¯ˆ! à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®Šà®°à¯ à®ªà¯†à®¯à®°à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.');
            return;
        }
        if (!formData.name || formData.name.trim() === '') {
            alert('âš ï¸ à®ªà¯†à®¯à®°à¯ à®…à®µà®šà®¿à®¯à®®à¯ à®¤à¯‡à®µà¯ˆ! à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®ªà¯†à®¯à®°à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.');
            return;
        }
        if (formData.phone && formData.phone.length !== 10) {
            alert('à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿ à®Žà®£à¯ 10 à®‡à®²à®•à¯à®• à®Žà®£à¯à®£à®¾à®• à®‡à®°à¯à®•à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯.');
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('à®®à¯Šà®¯à¯ à®¤à¯Šà®•à¯ˆ à®ªà¯‚à®œà¯à®œà®¿à®¯à®®à®¾à®• à®‡à®°à¯à®•à¯à®•à®•à¯à®•à¯‚à®Ÿà®¾à®¤à¯. à®šà®°à®¿à®¯à®¾à®© à®¤à¯Šà®•à¯ˆà®¯à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.');
            amountInputRef.current?.focus();
            return;
        }

        const townName = towns.find(t => t.id === formData.townId)?.name || townInputValue;
        const fullName = `${formData.initial ? formData.initial + (formData.initial.endsWith('.') ? '' : '.') : ''} ${formData.name}`.trim();
        const relationship = formData.relationshipName
            ? `${formData.relationshipName} ${formData.relationshipType === 'son' ? 'à®®à®•à®©à¯' : 'à®®à®•à®³à¯'}`
            : '';

        const entry = {
            id: `qr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: new Date().toISOString(),
            source: lastQrScanInfo ? 'qr' : 'manual',
            qrRaw: lastQrScanInfo?.raw || '',
            scannedAt: lastQrScanInfo?.scannedAt || null,
            memberId: formData.memberId,
            town: townName,
            townId: formData.townId,
            street: formData.street,
            initial: formData.initial,
            baseName: formData.name,
            name: fullName,
            relationshipName: formData.relationshipName,
            parentName: formData.relationshipName,
            relationshipType: formData.relationshipType,
            relationship,
            education: formData.education,
            profession: formData.profession,
            phone: formData.phone,
            note: formData.note,
            amount: parseFloat(formData.amount),
            isMaternalUncle: formData.isMaternalUncle,
        };

        const nextList = [entry, ...qrListEntries];
        setQrListEntries(nextList);
        persistQrList(nextList);
        setLastQrScanInfo(null);
        handleClearForm();
        setActiveTab('qr');
    };
    
    const handleSaveExpense = async (expenseData) => {
        // CRITICAL: Calculate next serial number from current event's entries only
        const eventEntries = moiEntries.filter(entry => entry.eventId === event.id);
        const nextSerialNumber = getNextSerialNumber(eventEntries, eventSerialMap);
        const newId = formatSerialNumber(nextSerialNumber);

        const newExpenseEntry = {
            id: newId,
            serialNumber: newId,
            eventId: event.id, // CRITICAL: Add eventId for proper event isolation
            table: loggedInTable,
            name: 'செலவு',
            note: expenseData.reason,
            amount: -Math.abs(parseFloat(expenseData.amount)),
            type: 'expense',
            town: '—',
            street: '',
            initial: '',
            baseName: 'செலவு',
            relationshipName: '',
            relationshipType: '',
            relationship: '',
            education: '',
            profession: '',
            phone: '',
            memberId: `EXP-${newId}`,
            isMaternalUncle: false,
            denominations: expenseData.denominations,
        };

        await addMoiEntry(newExpenseEntry);
        
        // Update PIN usage tracking
        if (expenseData.usedPin && updatePinUsage) {
            await updatePinUsage(event.id, expenseData.usedPin, newId, 'expense');
        }
        
        setIsExpenseModalOpen(false);
    };

    const handleSaveChange = async (changeData) => {
        // CRITICAL: Calculate next serial number from current event's entries only
        const eventEntries = moiEntries.filter(entry => entry.eventId === event.id);
        const nextSerialNumber = getNextSerialNumber(eventEntries, eventSerialMap);
        const newId = formatSerialNumber(nextSerialNumber);

        // Calculate the net change in denominations
        const netDenominations = {};
        const receivedSnapshot = {};
        const givenSnapshot = {};
        notes.forEach(note => {
            const received = parseInt(changeData.received[note], 10) || 0;
            const given = parseInt(changeData.given[note], 10) || 0;
            if (received !== 0) {
                receivedSnapshot[note] = received;
            }
            if (given !== 0) {
                givenSnapshot[note] = given;
            }
            netDenominations[note] = received - given;
        });

        const newChangeEntry = {
            id: newId,
            serialNumber: newId,
            eventId: event.id, // CRITICAL: Add eventId for proper event isolation
            table: loggedInTable,
            name: 'சில்லறை மாற்றுதல்',
            note: `பெற்றது: ₹${changeData.totalAmount}, கொடுத்தது: ₹${changeData.totalAmount}`,
            amount: 0, // Net amount is zero for an exchange
            type: 'change', // Use 'change' type to represent this transaction
            town: '—',
            denominations: netDenominations, // Store the net change
            receivedDenominations: receivedSnapshot,
            givenDenominations: givenSnapshot,
            // Fill other fields to avoid errors
            street: '',
            initial: '',
            baseName: 'சில்லறை மாற்றுதல்',
            relationshipName: '',
            relationshipType: '',
            relationship: '',
            education: '',
            profession: '',
            phone: '',
            memberId: `SWP-${newId}`,
            isMaternalUncle: false,
        };
        
        await addMoiEntry(newChangeEntry);
        setIsChangeModalOpen(false);
    };

    const handleBulkAdd = async () => {
        const lines = (bulkText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) {
            alert('பட்டியலை ஒட்டவும்: "ஊர்(optional), பெயர், தொகை"');
            return;
        }

        const eventEntries = moiEntries.filter(entry => entry.eventId === event.id);
        let nextIdNumber = getNextSerialNumber(eventEntries, eventSerialMap);

        const allMemberIds = moiEntries
            .map(entry => entry.memberId)
            .filter(id => id && id.startsWith('UR-'))
            .map(id => parseInt(id.replace('UR-', ''), 10))
            .filter(num => !isNaN(num));
        let nextMemberSeq = allMemberIds.length > 0 ? Math.max(...allMemberIds) + 1 : 1;

        let successCount = 0;
        let skippedCount = 0;
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            // Support comma, tab, or pipe separators; fall back to comma
            const delimiter = line.includes('\t') ? '\t' : (line.includes('|') ? '|' : ',');
            const parts = line.split(delimiter).map(p => p.trim()).filter(Boolean);
            let town = '';
            let name = '';
            let amountStr = '';

            if (parts.length === 3) {
                [town, name, amountStr] = parts;
            } else if (parts.length === 2) {
                [name, amountStr] = parts;
            } else {
                console.warn('Skipping line (format issue):', line);
                skippedCount += 1;
                continue;
            }

            // Remove currency symbols/commas/spaces in amount
            const normalizedAmountStr = (amountStr || '').replace(/[^0-9.-]/g, '');
            const amount = parseFloat(normalizedAmountStr);
            if (!name || Number.isNaN(amount)) {
                console.warn('Skipping line (name/amount issue):', line);
                skippedCount += 1;
                continue;
            }

            const newId = formatSerialNumber(nextIdNumber);
            nextIdNumber += 1;

            const finalMemberId = `UR-${nextMemberSeq.toString().padStart(6, '0')}`;
            nextMemberSeq += 1;

            const entryTown = town || townInputValue || '';

            const newEntry = {
                id: newId,
                serialNumber: newId,
                eventId: event.id,
                table: loggedInTable,
                town: entryTown,
                townId: '',
                street: '',
                initial: '',
                baseName: name,
                name,
                relationshipName: '',
                parentName: '',
                relationshipType: '',
                relationship: '',
                education: '',
                profession: '',
                phone: '',
                note: '',
                memberId: finalMemberId,
                amount: amount,
                isMaternalUncle: false,
                denominations: null,
            };

            try {
                await addMoiEntry(newEntry);
                successCount += 1;
            } catch (err) {
                console.warn('Bulk add failed for line:', line, err);
                skippedCount += 1;
            }
        }

        if (successCount > 0) {
            setIsBulkModalOpen(false);
            setBulkText('');
        }
        const summaryMessage = skippedCount
            ? `Bulk entry முடிந்தது. சேர்க்கப்பட்டது: ${successCount}, தாண்டப்பட்டது: ${skippedCount}`
            : `Bulk entry முடிந்தது. சேர்க்கப்பட்டது: ${successCount} பதிவுகள்.`;
        alert(summaryMessage);
    };

    const openDenominationModal = () => {
        if (!formData.townId && !townInputValue) {
            alert('âš ï¸ à®Šà®°à¯ à®ªà¯†à®¯à®°à¯ à®…à®µà®šà®¿à®¯à®®à¯ à®¤à¯‡à®µà¯ˆ! à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®Šà®°à¯ à®ªà¯†à®¯à®°à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.');
            return;
        }
        
        if (!formData.name || formData.name.trim() === '') {
            alert('âš ï¸ à®ªà¯†à®¯à®°à¯ à®…à®µà®šà®¿à®¯à®®à¯ à®¤à¯‡à®µà¯ˆ! à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®ªà¯†à®¯à®°à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.');
            return;
        }
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('à®®à¯Šà®¯à¯ à®¤à¯Šà®•à¯ˆ à®ªà¯‚à®œà¯à®œà®¿à®¯à®®à®¾à®• à®‡à®°à¯à®•à¯à®•à®•à¯à®•à¯‚à®Ÿà®¾à®¤à¯. à®šà®°à®¿à®¯à®¾à®© à®¤à¯Šà®•à¯ˆà®¯à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.');
            amountInputRef.current?.focus();
            return;
        }
        
        setIsDenominationModalOpen(true);
    };

    const handleAmountKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Validate mandatory fields before opening denomination modal
            if (!formData.townId && !townInputValue) {
                alert('⚠️ ஊர் பெயர் அவசியம் தேவை! தயவுசெய்து ஊர் பெயரை உள்ளிடவும்.');
                return;
            }
            
            if (!formData.name || formData.name.trim() === '') {
                alert('⚠️ பெயர் அவசியம் தேவை! தயவுசெய்து பெயரை உள்ளிடவும்.');
                return;
            }
            
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                alert('மொய் தொகை பூஜ்ஜியமாக இருக்கக்கூடாது. சரியான தொகையை உள்ளிடவும்.');
                amountInputRef.current?.focus();
                return;
            }
            setIsDenominationModalOpen(true);
        }
        
        // Auto-expand amount shortcuts on Space or Tab
        if (e.key === ' ' || e.key === 'Tab') {
            const expanded = expandAmountShortcut(formData.amount);
            if (expanded !== formData.amount) {
                e.preventDefault();
                setFormData(prev => ({ ...prev, amount: expanded }));
                if (e.key === ' ') {
                    // After expansion, validate before opening modal
                    setTimeout(() => {
                        e.target.blur();
                        // Validate mandatory fields before opening denomination modal
                        if (expanded && parseFloat(expanded) > 0) {
                            // Check if town and name are filled
                            if (!formData.townId && !townInputValue) {
                                alert('⚠️ ஊர் பெயர் அவசியம் தேவை! தயவுசெய்து ஊர் பெயரை உள்ளிடவும்.');
                                return;
                            }
                            
                            if (!formData.name || formData.name.trim() === '') {
                                alert('⚠️ பெயர் அவசியம் தேவை! தயவுசெய்து பெயரை உள்ளிடவும்.');
                                return;
                            }
                            
                            setIsDenominationModalOpen(true);
                        }
                    }, 100);
                }
            }
        }
    };
    
    // Generic shortcut expansion handler for text fields
    const handleShortcutKeyDown = (fieldName) => (e) => {
        if (e.key === ' ' || e.key === 'Tab') {
            const currentValue = formData[fieldName];
            let expanded = currentValue;
            
            // Apply appropriate shortcut expansion based on field
            if (fieldName === 'name') {
                expanded = expandNameShortcut(currentValue);
            } else if (fieldName === 'relationshipName') {
                expanded = expandRelationshipShortcut(currentValue);
            }
            
            // If expansion happened, update the field
            if (expanded !== currentValue && expanded !== currentValue) {
                e.preventDefault();
                setFormData(prev => ({ ...prev, [fieldName]: expanded }));
            }
        }
    };
    
    // Handlers for opening modals
    const handleRowClick = (entry, serialNumber) => {
        if (entry.type === 'expense' || entry.type === 'change') return;
        setSelectedEntry(withSerialNumber(entry, serialNumber));
        setIsEditModalOpen(true);
    };

    const handleAmountClick = (e, entry, serialNumber) => {
        if (entry.type === 'expense' || entry.type === 'change') return;
        e.stopPropagation(); // Prevent row click
        setSelectedEntry(withSerialNumber(entry, serialNumber));
        setIsAmountModalOpen(true);
    };

    const handleDeleteClick = (e, entry, serialNumber) => {
        if (entry.type === 'expense' || entry.type === 'change') return;
        e.stopPropagation(); // Prevent row click
        setSelectedEntry(withSerialNumber(entry, serialNumber));
        setIsDeleteModalOpen(true);
    };

    // Handlers for modal actions
    const handleUpdateEntry = async (updatedEntry) => {
        await updateMoiEntry(updatedEntry);
        try {
            await triggerReceiptPrint(updatedEntry);
        } catch (err) {
            console.error('Unexpected print failure after entry update', err);
        }
        setIsEditModalOpen(false);
        setSelectedEntry(null);
    };
    
    const handleUpdateAmount = async (entryId, newAmount, denominationData, usedPin) => {
        const entryToUpdate = moiEntries.find(e => e.id === entryId);
        if (entryToUpdate) {
            const { netDenominations, receivedDenominations, givenDenominations } = normalizeDenominationPayload(denominationData);
            const updatedEntry = {
                ...entryToUpdate,
                amount: newAmount,
                denominations: netDenominations,
                receivedDenominations: receivedDenominations || entryToUpdate.receivedDenominations || netDenominations,
                givenDenominations: givenDenominations || entryToUpdate.givenDenominations || null
            };
            await updateMoiEntry(updatedEntry);
            
            // Update PIN usage if PIN was used (for decreasing amounts)
            if (usedPin && updatePinUsage) {
                await updatePinUsage(event.id, usedPin, entryId, 'edit');
            }
            
            try {
                await triggerReceiptPrint(updatedEntry);
            } catch (err) {
                console.error('Unexpected print failure after amount update', err);
            }
        }
        setIsAmountModalOpen(false);
        setSelectedEntry(null);
    };

    const handleDeleteEntry = async (entryId, usedPin) => {
        await deleteMoiEntry(entryId);
        
        // Update PIN usage tracking
        if (usedPin && updatePinUsage) {
            await updatePinUsage(event.id, usedPin, entryId, 'delete');
        }
        
        setIsDeleteModalOpen(false);
        setSelectedEntry(null);
    };


    if (!event) {
        return (
             <div className="event-page">
                 <p>Default event not set or found. Please go back and select an event in settings.</p>
                 <button onClick={onBack}>Back</button>
            </div>
        );
    }
    
    return (
        <div className="event-page">
            <header className="master-header moi-form-header">
                 <div className="header-left">
                    <MoiBookIcon size={36} variant="white" />
                    <span className="icon">wifi</span>
                    <span className="icon">lan</span>
                    <span className="icon">database</span>
                    <div style={{ lineHeight: '1.3' }}>
                        <div>விழா எண்: {event.id}</div>
                        <div>மேசை: {loggedInTable}</div>
                    </div>
                </div>
                <div className="header-center">
                    <h2>{event.eventName}{event.eventSide && ` (${event.eventSide})`}</h2>
                    <p>தலைவர்: {event.eventHead} | அமைப்பாளர்: {event.eventOrganizer}</p>
                    <p>தேதி: {new Date(event.date).toLocaleDateString('en-GB')}</p>
                    
                    {/* Keyboard Language Indicator */}
                    <div style={{
                        marginTop: '8px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        backgroundColor: currentInputLanguage === 'tamil' ? '#2196F3' : 
                                       currentInputLanguage === 'english' ? '#4CAF50' : '#9E9E9E',
                        color: 'white',
                        transition: 'all 0.3s ease'
                    }}>
                        {currentInputLanguage === 'tamil' && '⌨️ தமிழ் Tamil Mode'}
                        {currentInputLanguage === 'english' && '⌨️ English Mode'}
                        {currentInputLanguage === 'unknown' && '⌨️ Type to detect...'}
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', opacity: 0.9 }}>
                            (Alt+Shift to switch)
                        </span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="header-whatsapp-toggle">
                        <button
                            type="button"
                            className={`whatsapp-toggle compact ${isMemberWhatsappEnabled ? 'on' : 'off'}`}
                            onClick={handleMemberWhatsappToggle}
                            role="switch"
                            aria-checked={isMemberWhatsappEnabled}
                            aria-label="WhatsApp Member ID Card"
                        >
                            <span className="whatsapp-toggle-knob" />
                            <span className="whatsapp-toggle-label">
                                {isMemberWhatsappEnabled ? 'WhatsApp ON' : 'WhatsApp OFF'}
                            </span>
                        </button>
                    </div>
                    <button className="icon-button" onClick={onBack} aria-label="Back">
                        <span className="icon">arrow_back</span>
                    </button>
                    <div className="header-menu-container">
                        <button className="icon-button" aria-label="Menu" onClick={() => setIsMenuOpen(prev => !prev)}>
                            <span className="icon">menu</span>
                        </button>
                        {isMenuOpen && (
                            <div className="header-menu-dropdown">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    onNavigateToMoiDetails();
                                    setIsMenuOpen(false);
                                }}>
                                    மொய் விபரம்
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsExpenseModalOpen(true);
                                    setIsMenuOpen(false);
                                }}>
                                    செலவு
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsChangeModalOpen(true);
                                    setIsMenuOpen(false);
                                }}>
                                    சில்லறை
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsShortcutsManagerOpen(true);
                                    setIsMenuOpen(false);
                                }}>
                                    ⚙️ ஊர் Shortcuts
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsShortcutsHelpOpen(true);
                                    setIsMenuOpen(false);
                                }}>
                                    💡 Shortcuts Guide
                                </a>
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsBulkModalOpen(true);
                                    setIsMenuOpen(false);
                                }}>
                                    🚀 Bulk Entry (List Paste)
                                </a>
                            </div>
                        )}
                    </div>
                    <button className="icon-button" onClick={handleClearForm} aria-label="Refresh">
                        <span className="icon">refresh</span>
                    </button>
                    <button className="icon-button" onClick={onLogout} aria-label="Logout">
                        <span className="icon">logout</span>
                    </button>
                </div>
            </header>

            {/* Keyboard Switch Alert */}
            {showKeyboardSwitchAlert && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: requiredKeyboardMode === 'tamil' ? '#2196F3' : '#4CAF50',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    animation: 'slideDown 0.3s ease'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>
                        {requiredKeyboardMode === 'tamil' ? '🆎' : '🅰️'}
                    </span>
                    <div>
                        {requiredKeyboardMode === 'tamil' && (
                            <>
                                <div>தமிழ் keyboard-க்கு மாறவும்</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                    Press Alt+Shift to switch to Tamil
                                </div>
                            </>
                        )}
                        {requiredKeyboardMode === 'english' && (
                            <>
                                <div>English keyboard-க்கு மாறவும்</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                    Press Alt+Shift to switch to English
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Inline Shortcuts Manager Section */}
            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #00695c'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    cursor: 'pointer'
                }} onClick={() => setIsShortcutsManagerOpen(!isShortcutsManagerOpen)}>
                    <h3 style={{ margin: 0, color: '#00695c', fontSize: '1.1rem' }}>
                        ⚙️ Custom ஊர் Shortcuts {isShortcutsManagerOpen ? '▼' : '▶'}
                    </h3>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        {(() => {
                            try {
                                const saved = localStorage.getItem('customTownShortcuts');
                                return saved ? `${Object.keys(JSON.parse(saved)).length} shortcuts` : '0 shortcuts';
                            } catch(e) {
                                return '0 shortcuts';
                            }
                        })()}
                    </span>
                </div>

                {isShortcutsManagerOpen && (
                    <div>
                        {/* Add Shortcut Form */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '150px 1fr auto',
                            gap: '10px',
                            marginBottom: '15px',
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '6px'
                        }}>
                            <input
                                type="text"
                                placeholder="Shortcut (cbe, mar...)"
                                value={(() => {
                                    if (!window.moiShortcutEdit) window.moiShortcutEdit = { shortcut: '', town: '', editing: null };
                                    return window.moiShortcutEdit.shortcut;
                                })()}
                                onChange={(e) => {
                                    if (!window.moiShortcutEdit) window.moiShortcutEdit = { shortcut: '', town: '', editing: null };
                                    window.moiShortcutEdit.shortcut = e.target.value;
                                    setIsShortcutsManagerOpen(true); // Force re-render
                                }}
                                style={{
                                    padding: '8px',
                                    border: '2px solid #00695c',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Town (கோயம்புத்தூர், மதுரை...)"
                                value={(() => {
                                    if (!window.moiShortcutEdit) window.moiShortcutEdit = { shortcut: '', town: '', editing: null };
                                    return window.moiShortcutEdit.town;
                                })()}
                                onChange={(e) => {
                                    if (!window.moiShortcutEdit) window.moiShortcutEdit = { shortcut: '', town: '', editing: null };
                                    window.moiShortcutEdit.town = e.target.value;
                                    setIsShortcutsManagerOpen(true); // Force re-render
                                }}
                                style={{
                                    padding: '8px',
                                    border: '2px solid #00695c',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (!window.moiShortcutEdit) window.moiShortcutEdit = { shortcut: '', town: '', editing: null };
                                    const sc = window.moiShortcutEdit.shortcut.trim();
                                    const tn = window.moiShortcutEdit.town.trim();
                                    
                                    if (!sc || !tn) {
                                        alert('Shortcut மற்றும் Town இரண்டும் வேண்டும்!');
                                        return;
                                    }
                                    
                                    try {
                                        const saved = localStorage.getItem('customTownShortcuts');
                                        const shortcuts = saved ? JSON.parse(saved) : {};
                                        shortcuts[sc] = tn;
                                        localStorage.setItem('customTownShortcuts', JSON.stringify(shortcuts));
                                        window.moiShortcutEdit = { shortcut: '', town: '', editing: null };
                                        setIsShortcutsManagerOpen(true); // Force re-render
                                        alert(`✅ Added: ${sc} → ${tn}`);
                                    } catch(e) {
                                        alert('Error saving shortcut!');
                                    }
                                }}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#00695c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Shortcuts List */}
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            padding: '10px',
                            borderRadius: '6px'
                        }}>
                            {(() => {
                                try {
                                    const saved = localStorage.getItem('customTownShortcuts');
                                    if (!saved) return <p style={{ color: '#666', textAlign: 'center' }}>No custom shortcuts yet</p>;
                                    
                                    const shortcuts = JSON.parse(saved);
                                    const entries = Object.entries(shortcuts);
                                    
                                    if (entries.length === 0) {
                                        return <p style={{ color: '#666', textAlign: 'center' }}>No custom shortcuts yet</p>;
                                    }
                                    
                                    return entries.map(([sc, tn]) => (
                                        <div key={sc} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '100px 1fr auto',
                                            gap: '10px',
                                            alignItems: 'center',
                                            padding: '8px',
                                            marginBottom: '5px',
                                            backgroundColor: '#f9f9f9',
                                            borderRadius: '4px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <span style={{
                                                backgroundColor: '#00695c',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                fontSize: '0.9rem'
                                            }}>
                                                {sc}
                                            </span>
                                            <span style={{ fontSize: '0.95rem' }}>→ {tn}</span>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Delete "${sc}"?`)) {
                                                        try {
                                                            const saved = localStorage.getItem('customTownShortcuts');
                                                            const shortcuts = JSON.parse(saved);
                                                            delete shortcuts[sc];
                                                            localStorage.setItem('customTownShortcuts', JSON.stringify(shortcuts));
                                                            setIsShortcutsManagerOpen(true); // Force re-render
                                                        } catch(e) {
                                                            alert('Error deleting!');
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    padding: '4px 12px',
                                                    backgroundColor: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ));
                                } catch(e) {
                                    return <p style={{ color: '#f44336' }}>Error loading shortcuts</p>;
                                }
                            })()}
                        </div>
                    </div>
                )}
            </div>

            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap'
            }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        border: '1px solid #1f2937',
                        backgroundColor: activeTab === 'form' ? '#1f2937' : '#fff',
                        color: activeTab === 'form' ? '#fff' : '#1f2937',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Form
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('qr')}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        border: '1px solid #0f766e',
                        backgroundColor: activeTab === 'qr' ? '#0f766e' : '#fff',
                        color: activeTab === 'qr' ? '#fff' : '#0f766e',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    QR List ({qrListEntries.length})
                </button>
            </div>

            {activeTab === 'form' && (
                <>
            <form className="event-form" onSubmit={(e) => e.preventDefault()}>
                <div className="moi-form-grid">
                    {/* Row 1: Member Id + Town */}
                    <div className="input-group floating-label-group col-span-4" style={{position: 'relative'}}>
                        <input
                            type="text"
                            name="memberId"
                            value={formData.memberId}
                            onChange={handleInputChange}
                            ref={memberIdInputRef}
                            placeholder=" "
                            style={{
                                borderColor: memberSearchStatus === 'found' ? '#4CAF50' :
                                            memberSearchStatus === 'not-found' ? '#f44336' : ''
                            }}
                        />
                        <label>உறுப்பினர் எண்/ தொலைபேசி எண்</label>
                        {memberSearchStatus === 'found' && (
                            <span className="icon search-icon" style={{color: '#4CAF50'}}>check_circle</span>
                        )}
                        {memberSearchStatus === 'not-found' && (
                            <span className="icon search-icon" style={{color: '#f44336'}}>person_add</span>
                        )}
                        {!memberSearchStatus && (
                            <span className="icon search-icon">search</span>
                        )}
                        <button
                            type="button"
                            className="icon-button"
                            aria-label="QR Scan"
                            onClick={() => setIsQrScanOpen(true)}
                            style={{
                                position: 'absolute',
                                right: '44px',
                                top: '50%',
                                transform: 'translateY(-50%)'
                            }}
                        >
                            <span className="icon">qr_code_scanner</span>
                        </button>
                        {memberSearchStatus === 'not-found' && (
                            <small style={{
                                position: 'absolute',
                                bottom: '-18px',
                                left: '0',
                                color: '#f44336',
                                fontSize: '0.75rem'
                            }}>
                                பதிவு இல்லை - புதிய நபர்
                            </small>
                        )}
                    </div>
                    <div className="form-group floating-label-group col-span-8" style={{position: 'relative'}}>
                         <SearchableComboBox
                            options={filteredTowns}
                            value={townInputValue}
                            enableShortcuts={true}
                            shortcutExpander={expandShortcutOnSpace}
                            onValueChange={(val) => {
                                const suggestion = getShortcutSuggestion(val);
                                if (suggestion && val.length >= 2) {
                                    setTownShortcutHint(`${suggestion.shortcut} → ${suggestion.town}`);
                                } else {
                                    setTownShortcutHint('');
                                }
                                setTownInputValue(val);
                                if (!filteredTowns.some(t => t.name === val)) {
                                  setFormData(p => ({...p, townId: ''}));
                                }
                            }}
                            onOptionSelect={(option) => {
                                setFormData(p => ({...p, townId: option.id}));
                                setTownInputValue(option.name);
                                setTownShortcutHint('');
                            }}
                            onBlur={() => {
                                if (townInputValue && townInputValue.trim().length > 0) {
                                    try {
                                        const town = townInputValue.trim();
                                        const usage = JSON.parse(localStorage.getItem('townUsageCount') || '{}');
                                        usage[town] = (usage[town] || 0) + 1;
                                        localStorage.setItem('townUsageCount', JSON.stringify(usage));
                                    } catch(e) {
                                        console.error('Error tracking town usage:', e);
                                    }
                                }
                                const corrected = autoCorrectTownName(townInputValue);
                                if (corrected !== townInputValue) {
                                    setTownInputValue(corrected);
                                    console.log(`Auto-corrected: "${townInputValue}" → "${corrected}"`);
                                }
                            }}
                            placeholder=" "
                        />
                        <label>
                            ஊர் (shortcuts: cbe/கோ, che/சே, mad/ம...)
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#2196F3',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️த
                            </span>
                        </label>
                        {townShortcutHint && (
                            <small style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '0',
                                color: '#2196F3',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                💡 {townShortcutHint}
                            </small>
                        )}
                    </div>

                    <div className="full-width" style={{ height: 0 }} />

                    {/* Row 2: Street + Initial + Name */}
                    <div className="form-group floating-label-group col-span-3" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            onFocus={() => handleFieldFocus('street')}
                            onBlur={handleFieldBlur}
                            placeholder=" "
                        />
                        <label>
                            தெரு/ இருப்பு
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#2196F3',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️த
                            </span>
                        </label>
                    </div>
                    <div className="form-group floating-label-group col-span-2" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="initial"
                            value={formData.initial}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('initial')}
                            onBlur={() => setFocusedField('')}
                            placeholder=" "
                            style={{
                                borderColor: focusedField === 'initial' ?
                                    (currentInputLanguage === 'tamil' ? '#2196F3' :
                                     currentInputLanguage === 'english' ? '#4CAF50' : '#ccc') : '#ccc',
                                borderWidth: focusedField === 'initial' ? '2px' : '1px',
                                transition: 'all 0.2s ease'
                            }}
                        />
                        <label>
                            Initial
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#888',
                                marginLeft: '3px',
                                fontWeight: 'normal'
                            }}>
                                (EN/த)
                            </span>
                        </label>
                        {focusedField === 'initial' && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '4px',
                                padding: '4px 8px',
                                backgroundColor: currentInputLanguage === 'tamil' ? '#2196F3' :
                                               currentInputLanguage === 'english' ? '#4CAF50' : '#9E9E9E',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
                                zIndex: 10,
                                animation: 'fadeIn 0.2s'
                            }}>
                                {currentInputLanguage === 'tamil' && '🆎 தமிழ் mode active'}
                                {currentInputLanguage === 'english' && '🅰️ English mode active'}
                                {currentInputLanguage === 'unknown' && '⌨️ Type to detect language'}
                            </div>
                        )}
                    </div>
                    <div className="form-group floating-label-group col-span-7" style={{ position: 'relative' }}>
                         <SearchableComboBox
                            options={filteredPeople}
                            value={formData.name}
                            onValueChange={(val) => {
                                setFormData(p => ({ ...p, name: val }));
                                const hint = getNameSuggestion(val);
                                setNameShortcutHint(hint || '');
                            }}
                            onOptionSelect={handleNameOptionSelect}
                            placeholder=" "
                            enableShortcuts={true}
                            shortcutExpander={expandNameShortcut}
                        />
                        <label>
                            பெயர்
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#2196F3',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️த (ram, mur, lak...)
                            </span>
                        </label>
                        {nameShortcutHint && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                fontSize: '0.7rem',
                                color: '#4CAF50',
                                fontWeight: 'bold',
                                marginTop: '2px',
                                padding: '2px 6px',
                                backgroundColor: '#E8F5E9',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap',
                                zIndex: 10
                            }}>
                                💡 {nameShortcutHint} (Press Space/Tab)
                            </div>
                        )}
                    </div>

                    <div className="full-width" style={{ height: 0 }} />

                    {/* Row 3: Parent Name + Profession + Education */}
                    <div className="form-group floating-label-group col-span-3" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="relationshipName"
                            value={formData.relationshipName}
                            onChange={handleInputChange}
                            onKeyDown={handleShortcutKeyDown('relationshipName')}
                            onFocus={() => handleFieldFocus('relationshipName')}
                            onBlur={handleFieldBlur}
                            placeholder=" "
                        />
                        <label>
                            பெற்றோர் பெயர்
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#2196F3',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️த
                            </span>
                        </label>
                        {relationshipShortcutHint && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                fontSize: '0.7rem',
                                color: '#4CAF50',
                                fontWeight: 'bold',
                                marginTop: '2px',
                                padding: '2px 6px',
                                backgroundColor: '#E8F5E9',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap',
                                zIndex: 10
                            }}>
                                💡 {relationshipShortcutHint} (Press Space/Tab)
                            </div>
                        )}
                    </div>
                    <div className="form-group floating-label-group col-span-3" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="profession"
                            value={formData.profession}
                            onChange={handleInputChange}
                            onFocus={() => handleFieldFocus('profession')}
                            onBlur={handleFieldBlur}
                            placeholder=" "
                        />
                        <label>
                            தொழில்
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#2196F3',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️த
                            </span>
                        </label>
                    </div>
                    <div className="form-group floating-label-group col-span-3" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="education"
                            value={formData.education}
                            onChange={handleInputChange}
                            onFocus={() => handleFieldFocus('education')}
                            onBlur={handleFieldBlur}
                            placeholder=" "
                        />
                        <label>
                            படிப்பு
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#4CAF50',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️EN
                            </span>
                        </label>
                    </div>
                    <div className="form-group floating-label-group col-span-3">
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={handlePhoneBlur}
                            ref={phoneInputRef}
                            placeholder=" "
                        />
                        <label>தொலைபேசி எண்</label>
                    </div>

                    <div className="full-width" style={{ height: 0 }} />

                    {/* Row 4: Relationship Type + Maternal + Note + Amount */}
                    <div className="form-group col-span-1">
                        <label style={{fontWeight: 'normal', position: 'relative', top: '-0.5rem'}}>உறவு முறை</label>
                        <div className="radio-group" style={{paddingTop: '0'}}>
                            <label>
                                <input
                                    type="radio"
                                    name="relationshipType"
                                    value="son"
                                    checked={formData.relationshipType === 'son'}
                                    onChange={handleInputChange}
                                    disabled={!formData.relationshipName}
                                /> மகன்
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="relationshipType"
                                    value="daughter"
                                    checked={formData.relationshipType === 'daughter'}
                                    onChange={handleInputChange}
                                    disabled={!formData.relationshipName}
                                />மகள்
                            </label>
                        </div>
                    </div>
                     <div className="form-group col-span-3">
                        <div className="checkbox-group" style={{paddingTop: '1.5rem'}}>
                           <label><input type="checkbox" name="isMaternalUncle" checked={formData.isMaternalUncle} onChange={handleInputChange}/> தாய்மாமன்</label>
                        </div>
                    </div>
                    <div className="form-group floating-label-group col-span-4" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            name="note"
                            value={formData.note}
                            onChange={handleInputChange}
                            onFocus={() => handleFieldFocus('note')}
                            onBlur={handleFieldBlur}
                            placeholder=" "
                        />
                        <label>
                            குறிப்பு
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#2196F3',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                ⌨️த
                            </span>
                        </label>
                    </div>
                     <div className="form-group floating-label-group col-span-4" style={{ position: 'relative' }}>
                        <input
                            type="tel"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            ref={amountInputRef}
                            onKeyDown={handleAmountKeyDown}
                            className="amount-input"
                            placeholder=" "
                        />
                        <label>
                            மொய் தொகை
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#FF9800',
                                marginLeft: '3px',
                                fontWeight: 'bold'
                            }}>
                                💰 (2=200, 5=500, 1k=1000, 1l=100000)
                            </span>
                        </label>
                        {amountShortcutHint && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                fontSize: '0.7rem',
                                color: '#FF9800',
                                fontWeight: 'bold',
                                marginTop: '2px',
                                padding: '2px 6px',
                                backgroundColor: '#FFF3E0',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap',
                                zIndex: 10
                            }}>
                                💡 {amountShortcutHint} (Press Space/Tab)
                            </div>
                        )}
                    </div>
                </div>
            </form>

             <section className="event-table-container" style={{marginTop: '2rem'}}>
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="தேடல் (வரிசை எண், ஊர், பெயர்...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <table className="moi-entry-table">
                    <thead>
                        <tr>
                            <th>வரிசை எண்</th>
                            <th>ஊர்</th>
                            <th>பெயர்</th>
                            <th>தொகை</th>
                            <th>செயல்</th>
                        </tr>
                    </thead>
                     <tbody>
                        {filteredMoiEntries.map((entry) => {
                            const isActionable = entry.type !== 'expense' && entry.type !== 'change';
                            const isExchange = entry.type === 'change' && entry.amount === 0;
                            const displaySerialNumber = resolveSerialNumber(entry);
                            const displaySerialText = formatSerialNumber(displaySerialNumber)
                                || entry.serialNumber
                                || entry.entryNumber
                                || entry.id;

                            return (
                                <tr
                                    key={entry.id}
                                    onClick={() => isActionable && handleRowClick(entry, displaySerialNumber)}
                                    className={
                                        entry.type === 'expense' ? 'expense-row' :
                                        entry.type === 'change' ? 'change-row' : ''
                                    }
                                    style={{ cursor: isActionable ? 'pointer' : 'default' }}
                                >
                                    <td>
                                        <span>{displaySerialText}</span>
                                        <span className="sub-text">{entry.memberId}</span>
                                    </td>
                                    <td>
                                        <span>{entry.town}</span>
                                        <span className="sub-text">{entry.street}</span>
                                    </td>
                                    <td>
                                        <span>{entry.relationship} {entry.name}{entry.isMaternalUncle ? ' (*)' : ''}</span>
                                        <span className="sub-text">
                                            {entry.type === 'expense'
                                                ? `காரணம்: ${entry.note}`
                                                : entry.type === 'change'
                                                ? `${entry.note}`
                                                : <>
                                                    {entry.education && `${entry.education} `}
                                                    {entry.profession && `(${entry.profession})`}
                                                    {entry.phone && ` - ${entry.phone}`}
                                                  </>
                                            }
                                        </span>
                                        {entry.type !== 'expense' && entry.type !== 'change' && entry.note && <span className="sub-text">குறிப்பு: {entry.note}</span>}
                                    </td>
                                    <td className="amount-cell" onClick={(e) => isActionable && handleAmountClick(e, entry, displaySerialNumber)}>
                                        {isExchange ? '—' : `₹${Math.abs(entry.amount).toLocaleString('en-IN')}`}
                                    </td>
                                    <td className="delete-cell">
                                        {isActionable && (
                                            <span className="icon" onClick={(e) => handleDeleteClick(e, entry, displaySerialNumber)}>delete</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </section>
                </>
            )}

            {activeTab === 'qr' && (
                <section className="event-table-container" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0 }}>QR List</h3>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>{qrListEntries.length} items</span>
                    </div>
                    {qrListEntries.length === 0 ? (
                        <div style={{
                            padding: '16px',
                            textAlign: 'center',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '8px',
                            background: '#f8fafc'
                        }}>
                            QR list காலியாக உள்ளது.
                        </div>
                    ) : (
                        <table className="moi-entry-table">
                            <thead>
                                <tr>
                                    <th>நேரம்</th>
                                    <th>உறுப்பினர்</th>
                                    <th>பெயர்</th>
                                    <th>ஊர்</th>
                                    <th>தொகை</th>
                                    <th>விவரம்</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qrListEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <span>{formatQrTimestamp(entry.createdAt)}</span>
                                            <span className="sub-text">
                                                {entry.source === 'qr' ? 'QR Scan' : 'Manual'}
                                            </span>
                                        </td>
                                        <td>
                                            <span>{entry.memberId || '-'}</span>
                                            <span className="sub-text">{entry.phone || ''}</span>
                                        </td>
                                        <td>
                                            <span>{entry.relationship ? `${entry.relationship} ${entry.name}` : entry.name}</span>
                                            {entry.isMaternalUncle && <span className="sub-text">(*) தாய்மாமன்</span>}
                                        </td>
                                        <td>
                                            <span>{entry.town || '-'}</span>
                                            <span className="sub-text">{entry.street || ''}</span>
                                        </td>
                                        <td className="amount-cell">
                                            {Number.isFinite(entry.amount) ? `₹${Math.abs(entry.amount).toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td>
                                            <span>{entry.note || '-'}</span>
                                            <span className="sub-text">
                                                {entry.education || ''} {entry.profession ? `(${entry.profession})` : ''}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            )}

            {isDenominationModalOpen && (
                <DenominationModal
                    totalAmount={parseFloat(formData.amount) || 0}
                    onSave={handleSave}
                    onClose={() => setIsDenominationModalOpen(false)}
                />
            )}

            {isExpenseModalOpen && (
                <ExpenseModal
                    event={event}
                    onSave={handleSaveExpense}
                    onClose={() => setIsExpenseModalOpen(false)}
                    updatePinUsage={updatePinUsage}
                />
            )}

            {isChangeModalOpen && (
                <ChangeModal
                    onSave={handleSaveChange}
                    onClose={() => setIsChangeModalOpen(false)}
                />
            )}

            {isBulkModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1200,
                        padding: '16px'
                    }}
                    onClick={() => setIsBulkModalOpen(false)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: '720px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                            padding: '20px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                            <h3 style={{margin: 0}}>🚀 Bulk Entry (List Paste)</h3>
                            <button
                                className="icon-button"
                                onClick={() => setIsBulkModalOpen(false)}
                                aria-label="Close"
                            >
                                <span className="icon">close</span>
                            </button>
                        </div>
                        <div style={{fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '12px', background: '#f3f6fb', padding: '12px', borderRadius: '8px'}}>
                            <div>ஒவ்வொரு வரியிலும்: <strong>ஊர்(optional), பெயர், தொகை</strong> (கமா பிரித்து)</div>
                            <div style={{marginTop: '6px'}}>உதாரணம்:</div>
                            <div style={{fontFamily: 'monospace', background: '#eef3ff', padding: '8px', borderRadius: '6px', marginTop: '6px'}}>
                                மதுரை, ராஜா, 500<br/>
                                திருநகர், மீனா, 1000<br/>
                                சுந்தர், 750
                            </div>
                            <div style={{marginTop: '6px', color: '#555'}}>Duplicate check/receipt print இல்லாமல் வேகமாக சேமிக்க இது பயன்படும்.</div>
                        </div>
                        <textarea
                            style={{width: '100%', minHeight: '220px', padding: '12px', fontSize: '1rem', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'monospace'}}
                            placeholder="ஊர், பெயர், தொகை"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        />
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px'}}>
                            <button className="button button-secondary" onClick={() => setIsBulkModalOpen(false)}>ரத்து</button>
                            <button className="button" onClick={handleBulkAdd}>Bulk சேமி</button>
                        </div>
                    </div>
                </div>
            )}

            {isShortcutsManagerOpen && (
                <ShortcutsManager
                    isOpen={isShortcutsManagerOpen}
                    onClose={() => setIsShortcutsManagerOpen(false)}
                />
            )}
            
            {isShortcutsHelpOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setIsShortcutsHelpOpen(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        padding: '30px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '2px solid #2196F3',
                            paddingBottom: '15px'
                        }}>
                            <h2 style={{margin: 0, color: '#2196F3'}}>
                                💡 ஊர் Shortcuts - விரைவு வழிகாட்டி
                            </h2>
                            <button 
                                onClick={() => setIsShortcutsHelpOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#E3F2FD', borderRadius: '8px'}}>
                            <h3 style={{marginTop: 0, color: '#1976D2'}}>எப்படி பயன்படுத்துவது?</h3>
                            <ol style={{marginBottom: 0, lineHeight: '1.8'}}>
                                <li><strong>Shortcut type பண்ணுங்க:</strong> ஊர் field-ல் shortcut type பண்ணுங்க (example: "cbe")</li>
                                <li><strong>Space press பண்ணுங்க:</strong> Space key press பண்ணவும், auto-ஆ full name வரும்</li>
                                <li><strong>Or manual expand:</strong> Type செய்தவுடன் hint தெரியும், continue typing-னா expand ஆகும்</li>
                            </ol>
                        </div>
                        
                        {/* Frequently Typed Towns Suggestions - TOP OF MODAL */}
                        {(() => {
                            try {
                                const townUsage = localStorage.getItem('townUsageCount');
                                const usage = townUsage ? JSON.parse(townUsage) : {};
                                const customShortcuts = JSON.parse(localStorage.getItem('customTownShortcuts') || '{}');
                                
                                // Find towns typed 3+ times without shortcuts
                                const suggestions = Object.entries(usage)
                                    .filter(([town, count]) => count >= 3 && !customShortcuts[town] && !Object.values(customShortcuts).includes(town))
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 10);
                                
                                return (
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: suggestions.length > 0 ? '#FFF3E0' : '#F5F5F5',
                                        borderRadius: '8px',
                                        border: suggestions.length > 0 ? '2px solid #FF9800' : '2px solid #BDBDBD'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '10px'
                                        }}>
                                            <h3 style={{ margin: 0, color: suggestions.length > 0 ? '#E65100' : '#666', fontSize: '1rem' }}>
                                                💡 Frequently Typed Towns {suggestions.length > 0 ? '(Shortcut இல்லை)' : '(Tracking...)'}
                                            </h3>
                                            {Object.keys(usage).length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Clear all usage tracking?')) {
                                                            localStorage.removeItem('townUsageCount');
                                                            setIsShortcutsHelpOpen(false);
                                                            setTimeout(() => setIsShortcutsHelpOpen(true), 100);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '4px 12px',
                                                        backgroundColor: '#E65100',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                        
                                        {suggestions.length === 0 ? (
                                            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px dashed #999' }}>
                                                <p style={{ margin: '0', fontSize: '0.85rem', color: '#666' }}>
                                                    📊 <strong>Status:</strong><br/>
                                                    • Total towns tracked: {Object.keys(usage).length}<br/>
                                                    • Towns typed 3+ times: {Object.entries(usage).filter(([t,c]) => c >= 3).length}<br/>
                                                    • Already have shortcuts: {Object.entries(usage).filter(([t,c]) => c >= 3 && (customShortcuts[t] || Object.values(customShortcuts).includes(t))).length}<br/>
                                                    <br/>
                                                    💡 ஊர் field-ல் same town-ஐ <strong>3+ times type</strong> பண்ணுங்க, அப்போ suggestions காணும்!
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 10px 0' }}>
                                                    இந்த ஊர்களுக்கு shortcut create செய்தால் வேகமாக entry செய்யலாம்:
                                                </p>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '10px'
                                                }}>
                                                    {suggestions.map(([town, count]) => (
                                                <div key={town} style={{
                                                    backgroundColor: 'white',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #FF9800',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{town}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#999' }}>
                                                            {count} times typed
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button
                                                            onClick={() => {
                                                                const suggested = town.substring(0, 3).toLowerCase();
                                                                const sc = prompt(`Shortcut for "${town}":`, suggested);
                                                                if (sc && sc.trim()) {
                                                                    try {
                                                                        const shortcuts = JSON.parse(localStorage.getItem('customTownShortcuts') || '{}');
                                                                        shortcuts[sc.trim()] = town;
                                                                        localStorage.setItem('customTownShortcuts', JSON.stringify(shortcuts));
                                                                        
                                                                        // Remove from usage count
                                                                        const newUsage = {...usage};
                                                                        delete newUsage[town];
                                                                        localStorage.setItem('townUsageCount', JSON.stringify(newUsage));
                                                                        
                                                                        alert(`✅ Shortcut created: ${sc} → ${town}`);
                                                                        setIsShortcutsHelpOpen(false);
                                                                        setTimeout(() => setIsShortcutsHelpOpen(true), 100);
                                                                    } catch(e) {
                                                                        alert('Error creating shortcut!');
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '6px',
                                                                backgroundColor: '#4CAF50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            + Create
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newUsage = {...usage};
                                                                delete newUsage[town];
                                                                localStorage.setItem('townUsageCount', JSON.stringify(newUsage));
                                                                setIsShortcutsHelpOpen(false);
                                                                setTimeout(() => setIsShortcutsHelpOpen(true), 100);
                                                            }}
                                                            style={{
                                                                padding: '6px 10px',
                                                                backgroundColor: '#9E9E9E',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                            </>
                                        )}
                                    </div>
                                );
                            } catch(e) {
                                return (
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: '#FFEBEE',
                                        borderRadius: '8px',
                                        border: '2px solid #F44336'
                                    }}>
                                        <p style={{ margin: 0, color: '#C62828' }}>
                                            ⚠️ Error loading suggestions: {e.message}
                                        </p>
                                    </div>
                                );
                            }
                        })()}
                        
                        <h3 style={{color: '#333', marginBottom: '15px'}}>Your Custom Shortcuts:</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            marginBottom: '20px',
                            minHeight: '100px'
                        }}>
                            {(() => {
                                try {
                                    const saved = localStorage.getItem('customTownShortcuts');
                                    if (!saved) {
                                        return (
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                textAlign: 'center',
                                                padding: '40px 20px',
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: '8px',
                                                border: '2px dashed #ccc'
                                            }}>
                                                <p style={{fontSize: '1.1rem', color: '#666', marginBottom: '10px'}}>
                                                    📝 No custom shortcuts yet
                                                </p>
                                                <p style={{fontSize: '0.9rem', color: '#999'}}>
                                                    Add your first shortcut using the "⚙️ Custom ஊர் Shortcuts" section above!
                                                </p>
                                            </div>
                                        );
                                    }
                                    
                                    const shortcuts = JSON.parse(saved);
                                    const entries = Object.entries(shortcuts);
                                    
                                    if (entries.length === 0) {
                                        return (
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                textAlign: 'center',
                                                padding: '40px 20px',
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: '8px',
                                                border: '2px dashed #ccc'
                                            }}>
                                                <p style={{fontSize: '1.1rem', color: '#666', marginBottom: '10px'}}>
                                                    📝 No custom shortcuts yet
                                                </p>
                                                <p style={{fontSize: '0.9rem', color: '#999'}}>
                                                    Add your first shortcut using the "⚙️ Custom ஊர் Shortcuts" section above!
                                                </p>
                                            </div>
                                        );
                                    }
                                    
                                    // Separate English and Tamil shortcuts
                                    const englishShortcuts = [];
                                    const tamilShortcuts = [];
                                    
                                    entries.forEach(([shortcut, town]) => {
                                        // Check if shortcut contains Tamil characters
                                        if (/[\u0B80-\u0BFF]/.test(shortcut)) {
                                            tamilShortcuts.push([shortcut, town]);
                                        } else {
                                            englishShortcuts.push([shortcut, town]);
                                        }
                                    });
                                    
                                    // Sort alphabetically
                                    englishShortcuts.sort((a, b) => a[0].localeCompare(b[0]));
                                    // Sort Tamil by Unicode (அகரவரிசை)
                                    tamilShortcuts.sort((a, b) => a[0].localeCompare(b[0], 'ta'));
                                    
                                    return (
                                        <>
                                            {/* Left Column - English Shortcuts */}
                                            <div>
                                                <h4 style={{
                                                    margin: '0 0 10px 0',
                                                    color: '#2196F3',
                                                    fontSize: '1rem',
                                                    borderBottom: '2px solid #2196F3',
                                                    paddingBottom: '5px'
                                                }}>
                                                    🅰️ English Shortcuts
                                                </h4>
                                                {englishShortcuts.length === 0 ? (
                                                    <p style={{color: '#999', fontSize: '0.9rem', fontStyle: 'italic'}}>
                                                        No English shortcuts yet
                                                    </p>
                                                ) : (
                                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                                        {englishShortcuts.map(([shortcut, town]) => (
                                                            <div key={shortcut} style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#E3F2FD',
                                                                borderRadius: '6px',
                                                                border: '1px solid #2196F3',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px'
                                                            }}>
                                                                <code style={{
                                                                    backgroundColor: '#2196F3',
                                                                    color: 'white',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '13px',
                                                                    fontWeight: 'bold',
                                                                    minWidth: '50px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    {shortcut}
                                                                </code>
                                                                <span style={{fontSize: '13px', color: '#666'}}>→</span>
                                                                <span style={{fontSize: '13px', flex: 1}}>
                                                                    {town}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Right Column - Tamil Shortcuts */}
                                            <div>
                                                <h4 style={{
                                                    margin: '0 0 10px 0',
                                                    color: '#4CAF50',
                                                    fontSize: '1rem',
                                                    borderBottom: '2px solid #4CAF50',
                                                    paddingBottom: '5px'
                                                }}>
                                                    🆎 Tamil Shortcuts (அகரவரிசை)
                                                </h4>
                                                {tamilShortcuts.length === 0 ? (
                                                    <p style={{color: '#999', fontSize: '0.9rem', fontStyle: 'italic'}}>
                                                        தமிழ் shortcuts இல்லை
                                                    </p>
                                                ) : (
                                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                                        {tamilShortcuts.map(([shortcut, town]) => (
                                                            <div key={shortcut} style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#E8F5E9',
                                                                borderRadius: '6px',
                                                                border: '1px solid #4CAF50',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px'
                                                            }}>
                                                                <code style={{
                                                                    backgroundColor: '#4CAF50',
                                                                    color: 'white',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '13px',
                                                                    fontWeight: 'bold',
                                                                    minWidth: '50px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    {shortcut}
                                                                </code>
                                                                <span style={{fontSize: '13px', color: '#666'}}>→</span>
                                                                <span style={{fontSize: '13px', flex: 1}}>
                                                                    {town}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                } catch(e) {
                                    return (
                                        <div style={{
                                            gridColumn: '1 / -1',
                                            textAlign: 'center',
                                            padding: '20px',
                                            backgroundColor: '#ffebee',
                                            borderRadius: '8px',
                                            color: '#c62828'
                                        }}>
                                            Error loading shortcuts
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                        
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#FFF9C4',
                            borderRadius: '8px',
                            borderLeft: '4px solid #FBC02D'
                        }}>
                            <h4 style={{marginTop: 0, color: '#F57F17'}}>💡 எப்படி Add செய்வது:</h4>
                            <ul style={{marginBottom: 0, lineHeight: '1.6'}}>
                                <li>Form-க்கு மேலே உள்ள <strong>"⚙️ Custom ஊர் Shortcuts"</strong> section-ஐ expand செய்யவும்</li>
                                <li>Shortcut code + Town name type செய்து "Add" click செய்யவும்</li>
                                <li>உங்கள் shortcuts உடனே இங்கே தெரியும் மற்றும் ஊர் field-ல் work செய்யும்!</li>
                                <li>Event-க்கு ஏற்ற shortcuts add செய்து fast entry செய்யலாம் 🚀</li>
                            </ul>
                        </div>
                        
                        <div style={{
                            marginTop: '20px',
                            textAlign: 'center'
                        }}>
                            <button
                                onClick={() => setIsShortcutsHelpOpen(false)}
                                style={{
                                    padding: '12px 30px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                புரிந்தது ✓
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isQrScanOpen && (
                <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setIsQrScanOpen(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3>QR Scan</h3>
                            <button type="button" className="icon-button" onClick={() => setIsQrScanOpen(false)} aria-label="Close">
                                <span className="icon">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ flexDirection: 'column', gap: '12px' }}>
                            {typeof window !== 'undefined' && window.location.protocol !== 'https:' && (
                                <div style={{ color: '#b45309', fontSize: '0.9rem' }}>
                                    Camera வேலை செய்ய HTTPS அவசியம். மொபைலில் https://&lt;PC‑IP&gt;:3000/ மூலம் திறக்கவும்.
                                </div>
                            )}
                            <div id={qrReaderIdRef.current} style={{ width: '100%', minHeight: '280px' }} />
                            {qrScanError && (
                                <div style={{ color: '#b91c1c', fontSize: '0.95rem' }}>
                                    {qrScanError}
                                </div>
                            )}
                            <div style={{ color: '#1f2937', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                இந்த application உள்ளேயே QR scan செய்யலாம். Scan செய்தவுடன் தகவல்கள் auto‑fill ஆகும்.
                                பிறகு தொகை மட்டும் உள்ளீடு செய்து Save செய்யுங்கள்.
                            </div>
                            <div style={{ color: '#555', fontSize: '0.9rem' }}>
                                QR scan செய்தவுடன் விவரங்கள் auto‑fill ஆகும்.
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {isEditModalOpen && selectedEntry && (
                <EditEntryModal
                    entry={selectedEntry}
                    onSave={handleUpdateEntry}
                    onClose={() => setIsEditModalOpen(false)}
                    towns={towns}
                    people={people}
                />
            )}

            {isAmountModalOpen && selectedEntry && (
                <EditAmountModal
                    entry={selectedEntry}
                    event={event}
                    onSave={handleUpdateAmount}
                    onClose={() => setIsAmountModalOpen(false)}
                    updatePinUsage={updatePinUsage}
                />
            )}
            
            {isDeleteModalOpen && selectedEntry && (
                <DeleteConfirmationModal
                    entry={selectedEntry}
                    event={event}
                    onDelete={handleDeleteEntry}
                    onClose={() => setIsDeleteModalOpen(false)}
                    updatePinUsage={updatePinUsage}
                />
            )}

            {cardState && (
                <div className="member-idcard-export" aria-hidden="true">
                    <div className="member-idcard" ref={cardRef}>
                        <div className="member-idcard-header">
                            <div className="member-idcard-header-left">
                                <MoiBookIcon size={24} />
                                <div>
                                    <div className="member-idcard-title">MoiBook Member ID</div>
                                    <div className="member-idcard-code">{cardState.member.memberCode}</div>
                                </div>
                            </div>
                            <div className="member-idcard-org">
                                <div className="member-idcard-org-title">நிறுவனம்</div>
                                <div className="member-idcard-org-row">🏢 {settings?.billHeaderAddress || '-'}</div>
                                <div className="member-idcard-org-row">📞 {settings?.billHeaderPhone || '-'}</div>
                            </div>
                        </div>
                        <div className="member-idcard-body">
                            <div className="member-idcard-details">
                                <div className="member-idcard-name">
                                    {cardState.member.fullName || cardState.member.baseName}
                                </div>
                                <div className="member-idcard-row">📞 {cardState.member.phone || '-'}</div>
                                <div className="member-idcard-row">🏠 {cardState.member.town || '-'}</div>
                                <div className="member-idcard-row">🎓 {cardState.member.education || '-'}</div>
                                <div className="member-idcard-row">🤝 {cardState.member.relationship || '-'}</div>
                            </div>
                            <div className="member-idcard-qr">
                                <img src={cardState.qrDataUrl} alt="Member QR" />
                            </div>
                        </div>
                        <div className="member-idcard-footer">
                            <div className="member-idcard-qr-text">
                                QR Code: {cardState.member.memberCode}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
