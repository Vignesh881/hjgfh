/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import EventPage from './components/EventPage';
import RegistrarPage from './components/RegistrarPage';
import MembersPage from './components/MembersPage';
import EventDashboard from './components/EventDashboard';
import MasterPage from './components/MasterPage';
import SettingsPage from './components/SettingsPage';
import MoiEntryPage from './components/MoiEntryPage';
import MoiFormPage from './components/MoiFormPage';
import MoiDetailsPage from './components/MoiDetailsPage';
import MasterDashboard from './components/MasterDashboard';
import * as storage from './lib/localStorage'; // Local storage persistence
import databaseManager from './lib/databaseManager'; // Multi-system database manager
import UploadDBButton from './components/UploadDBButton';
import './lib/favicon'; // Auto-set favicon


// Initial data for seeding the database on first run
const initialEventsData = [
    {
        id: '0001',
        date: '2025-01-01',
        time: '10:00',
        venue: 'அமிர்தம் மஹால்',
        place: 'மதுரை',
        eventName: 'திருமண விழா',
        eventSide: 'மணமகன் வீட்டார்',
        eventHead: 'திரு. பெரியசாமி',
        eventHeadProf: 'தொழிலதிபர்',
        eventOrganizer: 'திரு. சின்னசாமி',
        eventOrganizerProf: 'மேலாளர்',
        organizationAddress: '123, தெற்கு மாசி வீதி, மதுரை.',
        organizationPhone: '0452456789',
        phone: '9876543210',
        address: '123, தெற்கு மாசி வீதி, மதுரை.',
        permission: true,
        invitationCount: '500',
        tableCount: '50',
        approvalPins: ['1234', '5678'],
    }
];

const initialRegistrarsData = [
    { id: '0001', name: 'திரு. குமரன்', address: '45, வடக்கு வீதி, மதுரை', phone: '9876543210', designation: 'காசாளர்', permission: true },
    { id: '0002', name: 'திருமதி. விமலா', address: '78, மேல மாசி வீதி, மதுரை', phone: '9876543211', designation: 'தட்டச்சாளர்', permission: true },
];

const initialSettings = {
    defaultEventId: '0001',
    registrarAssignments: {},
    printerAssignments: {},
    storageDriver: 'C:',
};

// Mock data for dropdowns (remains in-memory)
const mockTowns = [
    { id: '1', name: 'மதுரை-பழங்காநத்தம்' },
    { id: '2', name: 'திருநகர்' },
    { id: '3', name: 'அவனியாபுரம்' },
];

const mockPeople = [
    { id: '101', townId: '1', initial: 'M', name: 'முருகன்', phone: '9876543210', education: 'B.E', profession: 'Engineer' },
    { id: '102', townId: '1', initial: 'K', name: 'கண்ணன்', phone: '9876543211', education: 'M.Sc', profession: 'Teacher' },
    { id: '103', townId: '2', initial: 'R', name: 'ராஜா', phone: '9876543212', education: 'B.Com', profession: 'Business' },
];

export default function App() {
  // Support direct URL access to /settings in production build
  let initialPage = 'login';
  if (typeof window !== 'undefined' && window.location && window.location.pathname) {
    if (window.location.pathname === '/settings') {
      initialPage = 'settings';
    }
  }
  const [page, setPage] = useState(initialPage);
  const [previousPage, setPreviousPage] = useState('login');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loggedInTable, setLoggedInTable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // States to hold data from the database
  const [events, setEvents] = useState([]);
  const [registrars, setRegistrars] = useState([]);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState({});
  const [moiEntries, setMoiEntries] = useState([]);
  const [isSyncingMembers, setIsSyncingMembers] = useState(false);
  
  // Load data on component mount (API first, fallback to local storage)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const localHasData = storage.hasStoredData();
      const localEntries = localHasData ? storage.loadMoiEntries() : [];

      try {
        let apiEvents = [];
        let apiRegistrars = [];
  let apiMembers = [];
        let apiEntries = [];
        let apiSettings = [];
        let apiAvailable = false;

        try {
          apiEvents = await databaseManager.getEvents({ useLocalFallback: false });
          apiRegistrars = await databaseManager.getRegistrars({ useLocalFallback: false });
          apiMembers = await databaseManager.getMembers({ useLocalFallback: false });
          apiEntries = await databaseManager.getMoiEntries(null, { useLocalFallback: false });
          apiSettings = await databaseManager.getSettings({ useLocalFallback: false });
          apiAvailable = true;
        } catch (apiError) {
          console.warn('API fetch failed, falling back to local storage:', apiError);
        }

        if (apiAvailable) {
          const migratedEvents = [];
          if ((apiEvents?.length ?? 0) === 0 && localHasData) {
            const localEvents = storage.loadEvents();
            for (const event of localEvents) {
              try {
                await databaseManager.createEvent(event);
                migratedEvents.push(event.id || event.eventName);
              } catch (migrationError) {
                console.warn('Event migration failed for', event.id || event.eventName, migrationError);
              }
            }
            apiEvents = await databaseManager.getEvents({ useLocalFallback: false });
            if (migratedEvents.length) {
              console.log('Migrated events to API:', migratedEvents.length);
            }
          }

          const normalizedEvents = (apiEvents || []).map(evt => ({
            ...evt,
            id: evt.id?.toString().padStart(4, '0') || evt.id
          }));
          setEvents(normalizedEvents);
          storage.saveEvents(normalizedEvents);

          if ((apiRegistrars?.length ?? 0) === 0 && localHasData) {
            const localRegistrars = storage.loadRegistrars();
            for (const registrar of localRegistrars) {
              try {
                await databaseManager.createRegistrar(registrar);
              } catch (migrationError) {
                console.warn('Registrar migration failed for', registrar.id || registrar.name, migrationError);
              }
            }
            apiRegistrars = await databaseManager.getRegistrars({ useLocalFallback: false });
          }

          const normalizedRegistrars = Array.isArray(apiRegistrars) ? apiRegistrars.map(reg => ({
            ...reg,
            id: reg.id?.toString().padStart(4, '0') || reg.id
          })) : [];
          setRegistrars(normalizedRegistrars);
          storage.saveRegistrars(normalizedRegistrars);

          if ((apiMembers?.length ?? 0) === 0 && localHasData) {
            const localMembers = storage.loadMembers();
            for (const member of localMembers) {
              try {
                if (member.memberCode) {
                  await databaseManager.createMember(member);
                }
              } catch (migrationError) {
                console.warn('Member migration failed for', member.memberCode || member.name, migrationError);
              }
            }
            apiMembers = await databaseManager.getMembers({ useLocalFallback: false });
          }

          const normalizedMembers = Array.isArray(apiMembers) ? apiMembers.map(member => ({
            ...member,
            id: member.id?.toString().padStart(4, '0') || member.id,
            memberCode: member.memberCode || member.member_code || member.memberId || ''
          })) : [];
          setMembers(normalizedMembers);
          storage.saveMembers(normalizedMembers);

          // Backfill offline moi entries when API becomes available
          if (localEntries.length > 0) {
            const remoteKeys = new Set((apiEntries || []).map(e => `${e.eventId || ''}::${(e.id != null ? e.id : '')}`));
            const unsyncedEntries = localEntries.filter(entry => !remoteKeys.has(`${entry.eventId || ''}::${entry.id}`));

            if (unsyncedEntries.length > 0) {
              for (const entry of unsyncedEntries) {
                try {
                  await databaseManager.createMoiEntry(entry);
                } catch (migrationError) {
                  console.warn('Moi entry sync failed for', entry.id || entry.name, migrationError);
                }
              }

              try {
                apiEntries = await databaseManager.getMoiEntries(null, { useLocalFallback: false });
              } catch (reloadError) {
                console.warn('Reloading moi entries after sync failed; continuing with existing API data.', reloadError);
              }
            }
          }

          const normalizedEntries = Array.isArray(apiEntries) ? apiEntries : [];
          setMoiEntries(normalizedEntries);
          storage.saveMoiEntries(normalizedEntries);

          if (Array.isArray(apiSettings) && apiSettings.length > 0) {
            let parsedSettings = {};
            const candidate = apiSettings.find(setting => setting && typeof setting === 'object');
            if (candidate) {
              if (candidate.data && typeof candidate.data === 'object') {
                parsedSettings = candidate.data;
              } else if (candidate.data && typeof candidate.data === 'string' && candidate.data.trim()) {
                try {
                  parsedSettings = JSON.parse(candidate.data);
                } catch (parseError) {
                  console.warn('Failed to parse settings JSON from API:', parseError);
                }
              } else {
                const { id, key_name, keyName, value, data, ...rest } = candidate;
                if (Object.keys(rest).length > 0) {
                  parsedSettings = rest;
                }
              }
            }

            if (!parsedSettings || Object.keys(parsedSettings).length === 0) {
              parsedSettings = apiSettings.reduce((acc, setting) => {
                const key = setting.key_name || setting.keyName;
                if (!key) return acc;
                const value = setting.data && typeof setting.data === 'object'
                  ? setting.data
                  : (setting.value !== undefined ? setting.value : setting.data);
                return { ...acc, [key]: value };
              }, {});
            }

            const mergedSettings = Object.keys(parsedSettings || {}).length
              ? { ...initialSettings, ...parsedSettings }
              : initialSettings;
            setSettings(mergedSettings);
            storage.saveSettings(mergedSettings);
          } else if (localHasData) {
            setSettings(storage.loadSettings());
          } else {
            setSettings(initialSettings);
            storage.saveSettings(initialSettings);
          }
        } else if (localHasData) {
          console.log('Loading data from localStorage...');
          setEvents(storage.loadEvents());
          setRegistrars(storage.loadRegistrars());
          setMembers(storage.loadMembers());
          setSettings(storage.loadSettings());
          setMoiEntries(storage.loadMoiEntries());
        } else {
          console.log('Initializing with default data...');
          setEvents(initialEventsData);
          setRegistrars(initialRegistrarsData);
          setMembers([]);
          setSettings(initialSettings);
          setMoiEntries([]);

          storage.saveEvents(initialEventsData);
          storage.saveRegistrars(initialRegistrarsData);
          storage.saveMembers([]);
          storage.saveSettings(initialSettings);
          storage.saveMoiEntries([]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setEvents(initialEventsData);
        setRegistrars(initialRegistrarsData);
  setMembers([]);
        setSettings(initialSettings);
        setMoiEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to reload all data from localStorage (used after imports/restores)
  const reloadAllData = () => {
    try {
      setEvents(storage.loadEvents());
      setRegistrars(storage.loadRegistrars());
  setMembers(storage.loadMembers());
      setSettings(storage.loadSettings());
      setMoiEntries(storage.loadMoiEntries());
      console.log('All data reloaded from localStorage');
    } catch (error) {
      console.error('Failed to reload data:', error);
    }
  };

  // Temporarily set loading to false for initial testing
  if (isLoading) {
    setIsLoading(false);
  }

  // --- Data Management Functions ---

  const addOrUpdateEvent = async (eventData, isEditing) => {
      let eventToSave = { ...eventData };
      let syncedWithServer = false;

      try {
        if (isEditing && eventToSave.id) {
          await databaseManager.updateEvent(parseInt(eventToSave.id, 10), eventToSave);
          syncedWithServer = true;
        } else if (!isEditing) {
          const response = await databaseManager.createEvent(eventToSave);
          if (response?.id) {
            eventToSave = { ...eventToSave, id: response.id };
          }
          // Ensure defaults
          if (!eventToSave.permission) eventToSave.permission = true;
          if (!eventToSave.approvalPins) eventToSave.approvalPins = [];
          syncedWithServer = true;
        }
      } catch (error) {
        console.warn('Event API sync failed, falling back to local storage:', error);
      }

      if (!eventToSave.id) {
        // Fallback ID generation if server did not provide one
        const currentMaxId = events.reduce((max, event) => Math.max(max, parseInt(event.id, 10) || 0), 0);
        const historicalMaxId = moiEntries.reduce((max, entry) => {
          const entryEventId = parseInt(entry.eventId, 10) || 0;
          return Math.max(max, entryEventId);
        }, 0);
        const maxId = Math.max(currentMaxId, historicalMaxId);
        eventToSave.id = (maxId + 1).toString().padStart(4, '0');
        if (!eventToSave.permission) eventToSave.permission = true;
        if (!eventToSave.approvalPins) eventToSave.approvalPins = [];
      }

      let updatedEvents;
      if (syncedWithServer) {
        try {
          const remoteEvents = await databaseManager.getEvents();
          if (Array.isArray(remoteEvents) && remoteEvents.length >= 0) {
            // Normalize IDs from API
            updatedEvents = remoteEvents.map(evt => ({
              ...evt,
              id: evt.id?.toString().padStart(4, '0') || evt.id
            }));

            // Preserve freshly edited fields (e.g., organizationAddress/Phone) even if API omits them
            if (isEditing && eventToSave.id) {
              updatedEvents = updatedEvents.map(evt => evt.id === eventToSave.id
                ? { ...evt, ...eventToSave }
                : evt
              );
            }
          }
        } catch (error) {
          console.warn('Reloading events from API failed, using local state:', error);
        }
      }

      if (!updatedEvents) {
        if (isEditing) {
          updatedEvents = events.map(event => event.id === eventToSave.id ? { ...event, ...eventToSave } : event);
        } else {
          updatedEvents = [...events, eventToSave];
        }
      }

      setEvents(updatedEvents);
      storage.saveEvents(updatedEvents);
      console.log('Event added/updated:', eventToSave);
  };

  const deleteEvent = async (id) => {
      // Delete event but KEEP moi entries in database for audit trail
      // Entries remain accessible for reports and data recovery
      const updatedEvents = events.filter(event => event.id !== id);
      
      // Update state and persist to localStorage
      setEvents(updatedEvents);
      storage.saveEvents(updatedEvents);
      try {
        await databaseManager.deleteEvent(parseInt(id, 10));
      } catch (error) {
        console.warn('Failed to delete event in API. Local data updated only.', error);
      }
      
      console.log(`Event ${id} deleted. Moi entries preserved in database for audit trail.`);
  };
  
  const toggleEventPermission = async (id) => {
    const event = events.find(e => e.id === id);
    if(event) {
        const updatedEvents = events.map(e => e.id === id ? {...e, permission: !e.permission} : e);
        setEvents(updatedEvents);
        storage.saveEvents(updatedEvents);
        try {
          await databaseManager.updateEvent(parseInt(id, 10), updatedEvents.find(e => e.id === id));
        } catch (error) {
          console.warn('Failed to update event permission in API.', error);
        }
        console.log('Event permission toggled:', id);
    }
  };

  const addOrUpdateRegistrar = async (registrarData, isEditing) => {
      let registrarToSave = { ...registrarData };
      let syncedWithServer = false;

      try {
        if (isEditing && registrarToSave.id) {
          await databaseManager.updateRegistrar(parseInt(registrarToSave.id, 10), registrarToSave);
          syncedWithServer = true;
        } else if (!isEditing) {
          if (!registrarToSave.permission) registrarToSave.permission = true;
          const response = await databaseManager.createRegistrar(registrarToSave);
          if (response?.id) {
            registrarToSave = { ...registrarToSave, id: response.id };
          }
          syncedWithServer = true;
        }
      } catch (error) {
        console.warn('Registrar API sync failed, using local fallback:', error);
      }

      if (!registrarToSave.id) {
        const maxId = registrars.reduce((max, r) => Math.max(max, parseInt(r.id, 10) || 0), 0);
        registrarToSave.id = (maxId + 1).toString().padStart(4, '0');
        if (!registrarToSave.permission) registrarToSave.permission = true;
      }

      let updatedRegistrars;
      if (syncedWithServer) {
        try {
          const remoteRegistrars = await databaseManager.getRegistrars({ useLocalFallback: false });
          if (Array.isArray(remoteRegistrars)) {
            updatedRegistrars = remoteRegistrars.map(reg => ({
              ...reg,
              id: reg.id?.toString().padStart(4, '0') || reg.id,
              permission: reg.permission !== undefined ? reg.permission : true
            }));
          }
        } catch (error) {
          console.warn('Failed to reload registrars from API, falling back to local data:', error);
        }
      }

      if (!updatedRegistrars) {
        if (isEditing) {
          updatedRegistrars = registrars.map(registrar => registrar.id === registrarToSave.id ? registrarToSave : registrar);
        } else {
          updatedRegistrars = [...registrars, registrarToSave];
        }
      }

      setRegistrars(updatedRegistrars);
      storage.saveRegistrars(updatedRegistrars);
      console.log('Registrar added/updated:', registrarToSave);
  };

  const deleteRegistrar = async (id) => {
      const updatedRegistrars = registrars.filter(registrar => registrar.id !== id);
      setRegistrars(updatedRegistrars);
      storage.saveRegistrars(updatedRegistrars);
      try {
        await databaseManager.deleteRegistrar(parseInt(id, 10));
      } catch (error) {
        console.warn('Failed to delete registrar in API. Local data updated only.', error);
      }
      console.log('Registrar deleted:', id);
  };
  
  const toggleRegistrarPermission = async (id) => {
    const registrar = registrars.find(r => r.id === id);
    if(registrar) {
        const updatedRegistrars = registrars.map(r => r.id === id ? {...r, permission: !r.permission} : r);
        setRegistrars(updatedRegistrars);
        storage.saveRegistrars(updatedRegistrars);
        try {
          await databaseManager.updateRegistrar(parseInt(id, 10), updatedRegistrars.find(r => r.id === id));
        } catch (error) {
          console.warn('Failed to update registrar permission in API.', error);
        }
        console.log('Registrar permission toggled:', id);
    }
  };

  // --- Members management ---
  const addOrUpdateMember = async (memberData, isEditing) => {
    let memberToSave = { ...memberData };
    let syncedWithServer = false;

    try {
      if (isEditing && memberToSave.id) {
        await databaseManager.updateMember(parseInt(memberToSave.id, 10), memberToSave);
        syncedWithServer = true;
      } else if (!isEditing) {
        const response = await databaseManager.createMember(memberToSave);
        if (response?.id) memberToSave = { ...memberToSave, id: response.id };
        syncedWithServer = true;
      }
    } catch (error) {
      console.warn('Member API sync failed, using local fallback:', error);
    }

    if (!memberToSave.id) {
      const maxId = members.reduce((max, m) => Math.max(max, parseInt(m.id, 10) || 0), 0);
      memberToSave.id = (maxId + 1).toString().padStart(4, '0');
    }

    let updatedMembers;
    if (syncedWithServer) {
      try {
        const remoteMembers = await databaseManager.getMembers({ useLocalFallback: false });
        if (Array.isArray(remoteMembers)) {
          updatedMembers = remoteMembers.map(m => ({ ...m, id: m.id?.toString().padStart(4, '0') || m.id }));
        }
      } catch (error) {
        console.warn('Failed to reload members from API, falling back to local data:', error);
      }
    }

    if (!updatedMembers) {
      if (isEditing) {
        updatedMembers = members.map(m => m.id === memberToSave.id ? memberToSave : m);
      } else {
        updatedMembers = [...members, memberToSave];
      }
    }

    setMembers(updatedMembers);
    storage.saveMembers(updatedMembers);
    console.log('Member added/updated:', memberToSave);
  };

  const deleteMember = async (id) => {
    const updatedMembers = members.filter(m => m.id !== id && m.memberCode !== id && String(m.id) !== String(id));
    setMembers(updatedMembers);
    storage.saveMembers(updatedMembers);
    try {
      await databaseManager.deleteMember(parseInt(id, 10));
    } catch (error) {
      console.warn('Failed to delete member in API. Local data updated only.', error);
    }
    console.log('Member deleted:', id);
  };

  const toggleMemberPermission = async (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    const updatedMembers = members.map(m => m.id === id ? { ...m, permission: !m.permission } : m);
    setMembers(updatedMembers);
    storage.saveMembers(updatedMembers);
    try {
      await databaseManager.updateMember(parseInt(id, 10), updatedMembers.find(m => m.id === id));
    } catch (error) {
      console.warn('Failed to update member permission in API.', error);
    }
    console.log('Member permission toggled:', id);
  };
  
  // Update PIN usage when it's used for expense, edit, or delete
  const updatePinUsage = async (eventId, pinNumber, entryId, actionType) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const updatedPins = event.approvalPins.map(pinObj => {
      // Handle both old format (string) and new format (object)
      const currentPin = typeof pinObj === 'string' ? pinObj : pinObj.pin;
      
      if (currentPin === pinNumber) {
        // Convert to object format if needed and mark as used
        return {
          pin: pinNumber,
          used: true,
          usedBy: entryId,
          usedAt: new Date().toISOString(),
          usedFor: actionType // 'expense', 'edit', or 'delete'
        };
      }
      
      // Keep existing PIN object or convert string to object
      return typeof pinObj === 'string' 
        ? { pin: pinObj, used: false, usedBy: null, usedAt: null, usedFor: null }
        : pinObj;
    });
    
    const updatedEvent = { ...event, approvalPins: updatedPins };
    const updatedEvents = events.map(e => e.id === eventId ? updatedEvent : e);
    
    setEvents(updatedEvents);
    storage.saveEvents(updatedEvents);
    try {
      await databaseManager.updateEvent(parseInt(eventId, 10), updatedEvent);
    } catch (error) {
      console.warn('Failed to sync PIN usage update to API.', error);
    }
    console.log(`PIN ${pinNumber} marked as used for ${actionType} on entry ${entryId}`);
  };
  
  const bulkUpdateMoiEntries = async (entries) => {
    let syncedWithServer = false;
    try {
      for (const entry of entries) {
        const numericId = entry.id != null ? parseInt(entry.id, 10) : NaN;
        if (!Number.isNaN(numericId)) {
          await databaseManager.updateMoiEntry(numericId, entry);
        } else {
          await databaseManager.createMoiEntry(entry);
        }
      }
      syncedWithServer = true;
    } catch (error) {
      console.warn('Failed to sync bulk entries to API. Local data will be used.', error);
    }

    let updatedEntries = entries;
    if (syncedWithServer) {
      try {
        const remoteEntries = await databaseManager.getMoiEntries(null, { useLocalFallback: false });
        if (Array.isArray(remoteEntries)) {
          updatedEntries = remoteEntries.map(remote => ({
            ...remote,
            id: remote.id != null ? remote.id.toString() : remote.id
          }));
        }
      } catch (error) {
        console.warn('Failed to reload entries from API after bulk sync.', error);
      }
    }

    setMoiEntries(updatedEntries);
    storage.saveMoiEntries(updatedEntries);
    console.log('Moi entries bulk updated:', updatedEntries.length, 'entries');
  };

  const normalizePhoneDigits = (value) => {
    if (!value) return '';
    return String(value).replace(/[^0-9]/g, '');
  };

  const pickValue = (current, incoming) => {
    if (incoming === undefined || incoming === null) return current;
    const trimmedIncoming = typeof incoming === 'string' ? incoming.trim() : incoming;
    if (trimmedIncoming === '' || trimmedIncoming === current) return current || trimmedIncoming;
    if (!current) return trimmedIncoming;
    if (typeof trimmedIncoming === 'string' && typeof current === 'string') {
      return trimmedIncoming.length > current.length ? trimmedIncoming : current;
    }
    return current;
  };

  const buildMemberFromEntry = (entry, existingMember) => {
    const memberCode = (entry.memberId || entry.member_id || '').trim();
    const initial = entry.initial || existingMember?.initial || '';
    const baseName = entry.baseName || entry.base_name || existingMember?.baseName || existingMember?.base_name || '';
    const name = entry.name || entry.contributor_name || existingMember?.name || baseName;
    const fullName = initial && (baseName || name)
      ? `${initial}. ${baseName || name}`
      : (entry.fullName || existingMember?.fullName || name || baseName || '');
    const phoneDigits = normalizePhoneDigits(entry.phone || entry.contactNumber || existingMember?.phone || existingMember?.contactNumber);
    const phone = phoneDigits || existingMember?.phone || '';
    const town = entry.town || existingMember?.town || '';
    const townId = entry.townId || entry.town_id || existingMember?.townId || existingMember?.town_id || '';
    const street = entry.street || existingMember?.street || '';
    const addressParts = [street, town].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : (existingMember?.address || '');
    const relationshipName = entry.relationshipName || entry.relationship_name || existingMember?.relationshipName || existingMember?.relationship_name || '';
    const relationshipType = entry.relationshipType || entry.relationship_type || existingMember?.relationshipType || existingMember?.relationship_type || '';
    const relationship = entry.relationship || existingMember?.relationship || '';
  const education = entry.education || existingMember?.education || '';
  const profession = entry.profession || existingMember?.profession || '';
  const amount = entry.amount != null ? entry.amount : existingMember?.amount;
  const denominations = entry.denominations || existingMember?.denominations || null;
  const table = entry.table || existingMember?.table || null;
  const entryType = entry.type || existingMember?.type || null;
    const notesSet = new Set();
    if (existingMember?.notes) notesSet.add(existingMember.notes);
    if (entry.note) notesSet.add(entry.note);
    const notes = Array.from(notesSet).filter(Boolean).join('\n');
    const sourceEventId = (() => {
      const rawEventId = entry.eventId || entry.event_id;
      if (rawEventId) {
        const parsed = parseInt(rawEventId, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      if (existingMember?.sourceEventId) {
        const parsed = parseInt(existingMember.sourceEventId, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      if (existingMember?.source_event_id) {
        const parsed = parseInt(existingMember.source_event_id, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      return null;
    })();

  const isMaternalUncle = Boolean(entry.isMaternalUncle ?? entry.is_maternal_uncle ?? existingMember?.isMaternalUncle ?? existingMember?.is_maternal_uncle);

    return {
      memberCode,
      name,
      initial,
      baseName,
      fullName,
      phone,
      address,
      town,
      townId,
      street,
      relationshipName,
      relationshipType,
      relationship,
      education,
      profession,
      amount,
      denominations,
      table,
      type: entryType,
      isMaternalUncle,
      notes,
      sourceEventId
    };
  };

  const mergeMemberRecord = (existingRecord, newRecord) => {
    if (!existingRecord) return newRecord;
    return {
      memberCode: newRecord.memberCode || existingRecord.memberCode,
      name: pickValue(existingRecord.name, newRecord.name),
      initial: pickValue(existingRecord.initial, newRecord.initial),
      baseName: pickValue(existingRecord.baseName, newRecord.baseName),
      fullName: pickValue(existingRecord.fullName, newRecord.fullName),
      phone: pickValue(existingRecord.phone, newRecord.phone),
      address: pickValue(existingRecord.address, newRecord.address),
      town: pickValue(existingRecord.town, newRecord.town),
      townId: pickValue(existingRecord.townId, newRecord.townId),
      street: pickValue(existingRecord.street, newRecord.street),
      relationshipName: pickValue(existingRecord.relationshipName, newRecord.relationshipName),
      relationshipType: pickValue(existingRecord.relationshipType, newRecord.relationshipType),
      relationship: pickValue(existingRecord.relationship, newRecord.relationship),
      education: pickValue(existingRecord.education, newRecord.education),
      profession: pickValue(existingRecord.profession, newRecord.profession),
      amount: newRecord.amount || existingRecord.amount || null,
      denominations: newRecord.denominations || existingRecord.denominations || null,
      table: newRecord.table || existingRecord.table || null,
      type: newRecord.type || existingRecord.type || null,
      isMaternalUncle: existingRecord.isMaternalUncle || newRecord.isMaternalUncle,
      notes: Array.from(new Set([existingRecord.notes, newRecord.notes].filter(Boolean))).join('\n').trim(),
      sourceEventId: newRecord.sourceEventId || existingRecord.sourceEventId || null
    };
  };

  const buildMembersFromEntries = (entries, existingMembersList) => {
    const existingMap = new Map();
    existingMembersList.forEach(member => {
      const code = (member.memberCode || member.member_code || member.memberId || '').trim();
      if (!code) return;
      existingMap.set(code.toLowerCase(), buildMemberFromEntry({}, member));
    });

    const aggregated = new Map(existingMap);

    entries.forEach(entry => {
      const memberCode = (entry.memberId || entry.member_id || '').trim();
      if (!memberCode) return;
      const key = memberCode.toLowerCase();
      const existing = aggregated.get(key) || null;
      const newRecord = buildMemberFromEntry(entry, existing || existingMap.get(key) || null);
      aggregated.set(key, mergeMemberRecord(existing, newRecord));
    });

    return Array.from(aggregated.values());
  };

  const syncMembersFromEntries = async (eventId) => {
    if (isSyncingMembers) return;
    if (!eventId) {
      alert('முதலில் ஒரு விழாவைத் தேர்ந்தெடுக்கவும்.');
      return;
    }

    const entriesForEvent = moiEntries.filter(entry => {
      const entryEventId = entry.eventId || entry.event_id;
      return entryEventId && entryEventId.toString() === eventId.toString();
    });

    if (!entriesForEvent.length) {
      alert('இந்த விழாவிற்கு மொய்புக் பதிவுகள் ஏதுமில்லை.');
      return;
    }

    const membersToSync = buildMembersFromEntries(entriesForEvent, members);
    const filteredMembers = membersToSync.filter(member => member.memberCode);

    if (!filteredMembers.length) {
      alert('உறுப்பினர் குறியீடு கொண்ட பதிவுகள் இல்லை.');
      return;
    }

    setIsSyncingMembers(true);
    try {
      await databaseManager.syncMembers(filteredMembers);
      let refreshedMembers = [];
      try {
        refreshedMembers = await databaseManager.getMembers({ useLocalFallback: false });
      } catch (refreshError) {
        console.warn('Failed to reload members from API. Falling back to local storage.', refreshError);
        refreshedMembers = storage.loadMembers();
      }

      const normalizedMembers = Array.isArray(refreshedMembers) ? refreshedMembers.map(member => ({
        ...member,
        id: member.id?.toString().padStart(4, '0') || member.id,
        memberCode: member.memberCode || member.member_code || member.memberId || ''
      })) : [];

      setMembers(normalizedMembers);
      storage.saveMembers(normalizedMembers);
      alert('உறுப்பினர் தகவல்கள் வெற்றிகரமாக பதிவேற்றப்பட்டன.');
    } catch (error) {
      console.error('Failed to sync members:', error);
      alert('உறுப்பினர் பதிவேற்றம் தோல்வியடைந்தது.');
    } finally {
      setIsSyncingMembers(false);
    }
  };
  
  const addMoiEntry = async (entry) => {
    let entryToSave = { ...entry };
    let syncedWithServer = false;

    try {
      const response = await databaseManager.createMoiEntry(entryToSave);
      if (response?.id) {
        entryToSave = { ...entryToSave, id: response.id.toString() };
      }
      syncedWithServer = true;
    } catch (error) {
      console.warn('Failed to create moi entry in API. Falling back to local storage.', error);
    }

    let updatedEntries;
    if (syncedWithServer) {
      try {
        const remoteEntries = await databaseManager.getMoiEntries(null, { useLocalFallback: false });
        if (Array.isArray(remoteEntries)) {
          updatedEntries = remoteEntries.map(remote => ({
            ...remote,
            id: remote.id != null ? remote.id.toString() : remote.id
          }));
        }
      } catch (error) {
        console.warn('Failed to reload entries from API after add.', error);
      }
    }

    if (!updatedEntries) {
      updatedEntries = [...moiEntries, entryToSave];
    }

    setMoiEntries(updatedEntries);
    storage.saveMoiEntries(updatedEntries);
    console.log('Moi entry added:', entryToSave);
  }
  
  const updateMoiEntry = async (entry) => {
    let entryToSave = { ...entry };
    let syncedWithServer = false;

    try {
      const numericId = entryToSave.id != null ? parseInt(entryToSave.id, 10) : NaN;
      if (!Number.isNaN(numericId)) {
        await databaseManager.updateMoiEntry(numericId, entryToSave);
        syncedWithServer = true;
      }
    } catch (error) {
      console.warn('Failed to update moi entry in API. Using local fallback.', error);
    }

    let updatedEntries;
    if (syncedWithServer) {
      try {
        const remoteEntries = await databaseManager.getMoiEntries(null, { useLocalFallback: false });
        if (Array.isArray(remoteEntries)) {
          updatedEntries = remoteEntries.map(remote => ({
            ...remote,
            id: remote.id != null ? remote.id.toString() : remote.id
          }));
        }
      } catch (error) {
        console.warn('Failed to reload entries from API after update.', error);
      }
    }

    if (!updatedEntries) {
      updatedEntries = moiEntries.map(existingEntry => existingEntry.id === entryToSave.id ? entryToSave : existingEntry);
    }

    setMoiEntries(updatedEntries);
    storage.saveMoiEntries(updatedEntries);
    console.log('Moi entry updated:', entryToSave);
  }
  
  const deleteMoiEntry = async (id) => {
    const updatedEntries = moiEntries.filter(entry => entry.id !== id);
    setMoiEntries(updatedEntries);
    storage.saveMoiEntries(updatedEntries);
    try {
      const numericId = id != null ? parseInt(id, 10) : NaN;
      if (!Number.isNaN(numericId)) {
        await databaseManager.deleteMoiEntry(numericId);
      }
    } catch (error) {
      console.warn('Failed to delete moi entry in API. Local data updated only.', error);
    }
    console.log('Moi entry deleted:', id);
  }

  const updateSettingsState = async (newSettings) => {
    console.log('💾 Saving settings:', newSettings);
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    try {
      await databaseManager.saveSettings(newSettings);
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.warn('Failed to persist settings to API. Local data saved only.', error);
    }
  };

  // Download database function - export localStorage data as JSON with .db extension
  const downloadMoibookDB = () => {
    // Export all data from localStorage
    const dbData = storage.exportAllData();
    
    const dataStr = JSON.stringify(dbData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `moibook_${new Date().toISOString().split('T')[0]}.db.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('MoiBook database downloaded');
  };

  // --- Navigation and Login ---
  const handleLoginSuccess = (loginType, username) => {
    if (loginType === 'event') {
      setPage('event');
    } else if (loginType === 'master') {
      // admin -> Event page; master -> Master page
      if (username === 'admin') {
        setPage('event');
      } else if (username === 'master') {
        setPage('master');
      } else {
        setPage('event');
      }
    } else if (loginType === 'table') {
      setLoggedInTable(username);
      setPage('moi-entry');
    } else {
      alert(`${loginType} login successful! This page is under construction.`);
    }
  };

  const handleLogout = () => {
    setPage('login');
    setSelectedEventId(null);
    setLoggedInTable(null);
  };

  const navigateTo = (targetPage) => {
    setPreviousPage(page);
    setPage(targetPage);
  }
  
  const navigateToDashboard = (eventId) => {
    setSelectedEventId(eventId);
    setPreviousPage(page);
    setPage('dashboard');
  }
  
  const navigateToMasterDashboard = (eventId) => {
    setSelectedEventId(eventId);
    setPreviousPage(page);
    setPage('master-dashboard');
  }

  const navigateBack = () => {
    setPage(previousPage);
    setSelectedEventId(null);
  }

  if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', color: 'var(--primary-color)' }}>
          தரவுத்தளத்தைத் தயார் செய்கிறது...
        </div>
      );
  }

  if (page === 'master-dashboard') {
    // Only show permitted (not deleted/hidden) events in master dashboard
    const event = events.find(e => e.id === selectedEventId && (e.permission === true || e.permission === 'true'));
    if (!event) {
      return (
        <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
          தேர்ந்தெடுத்த விழா காணப்படவில்லை அல்லது அனுமதி இல்லை.
        </div>
      );
    }
    return <MasterDashboard 
        event={event} 
        moiEntries={moiEntries}
        setMoiEntries={bulkUpdateMoiEntries}
        onBack={navigateBack}
        reloadAllData={reloadAllData}
    loggedInTable={loggedInTable}
    onSyncMembers={() => syncMembersFromEntries(event.id)}
    isSyncingMembers={isSyncingMembers}
    />;
  }

  if (page === 'moi-details') {
    const defaultEvent = events.find(e => e.id === settings.defaultEventId);
    return <MoiDetailsPage
        event={defaultEvent}
        moiEntries={moiEntries}
        registrars={registrars}
        settings={settings}
        loggedInTable={loggedInTable}
        onBack={navigateBack}
    />;
  }

  if (page === 'moi-form') {
    const defaultEvent = events.find(e => e.id === settings.defaultEventId);
    return <MoiFormPage
        event={defaultEvent}
        loggedInTable={loggedInTable}
        onBack={navigateBack}
        onLogout={handleLogout}
        onNavigateToMoiDetails={() => navigateTo('moi-details')}
        moiEntries={moiEntries}
        addMoiEntry={addMoiEntry}
        updateMoiEntry={updateMoiEntry}
        deleteMoiEntry={deleteMoiEntry}
        updatePinUsage={updatePinUsage}
        settings={settings}
        towns={mockTowns}
        people={mockPeople}
    />;
  }

  if (page === 'settings') {
    return <SettingsPage 
      events={events} 
      registrars={registrars} 
      settings={settings}
      setSettings={updateSettingsState}
      onBack={navigateBack}
      downloadMoibookDB={downloadMoibookDB}
      reloadAllData={reloadAllData}
    />;
  }

  if (page === 'master') {
    return <MasterPage 
      events={events} 
      settings={settings}
      onLogout={handleLogout} 
      onNavigateToMasterDashboard={navigateToMasterDashboard}
      onNavigateToSettings={() => navigateTo('settings')}
      onSyncMembersFromEntries={syncMembersFromEntries}
      isSyncingMembers={isSyncingMembers}
    />;
  }

  if (page === 'moi-entry') {
    return <MoiEntryPage 
      events={events} 
      settings={settings}
      registrars={registrars}
      loggedInTable={loggedInTable}
      onLogout={handleLogout} 
      onNavigateToMoiForm={() => navigateTo('moi-form')}
    />;
  }

  if (page === 'event') {
    return <EventPage 
        events={events} 
        addOrUpdateEvent={addOrUpdateEvent}
        deleteEvent={deleteEvent}
        togglePermission={toggleEventPermission}
        onLogout={handleLogout} 
    onNavigateToRegistrar={() => navigateTo('registrar')} 
    onNavigateToMembers={() => navigateTo('members')}
        onNavigateToDashboard={navigateToDashboard} 
    />;
  }
  
  if (page === 'registrar') {
    return <RegistrarPage 
        registrars={registrars} 
        addOrUpdateRegistrar={addOrUpdateRegistrar}
        deleteRegistrar={deleteRegistrar}
        togglePermission={toggleRegistrarPermission}
        onBack={navigateBack} 
    />;
  }

  if (page === 'members') {
    return <MembersPage
      members={members}
      addOrUpdateMember={addOrUpdateMember}
      deleteMember={deleteMember}
      togglePermission={toggleMemberPermission}
      onBack={navigateBack}
    />;
  }

  if (page === 'dashboard') {
    return <EventDashboard 
        eventId={selectedEventId} 
        events={events}
        moiEntries={moiEntries}
        setMoiEntries={bulkUpdateMoiEntries}
        onBack={navigateBack}
        towns={mockTowns}
        people={mockPeople}
        members={members}
        addOrUpdateMember={addOrUpdateMember}
    />;
  }

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}