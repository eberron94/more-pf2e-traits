Hooks.once('setup', () => {
    const listOfNewTraits = [
        [
            TRAIT_KEY.ancestryTraits,
            'Warforged',
            'Living contructs, created only to fight in a never ending war. The core of a warforged is a skeletal frame made of metal and stone with wood fibres acting as a muscular system.',
        ],
        [
            TRAIT_KEY.ancestryTraits,
            'Half-Elf',
            'Humans with elven heritage.',
        ],
        [
            TRAIT_KEY.ancestryTraits,
            'Half-Orc',
            'Humans with orcish heritage.',
        ],
        [
            TRAIT_KEY.ancestryTraits,
            'Shifter',
            'An ancestry of weretouched individuals, their bodies are physically fit and lithe, they tend to move around in an animal like manner, crouching, springing and leaping.',
        ],
        [
            TRAIT_KEY.ancestryTraits,
            'Kalashtar',
            'Being the combination of humans who willingly fused with quori souls, kalashtar look much like humans. The only real difference in kalashtar is their monastic behaviour. Growing up for the kalashtar is simply a physical process rather than an emotional or mental one. ',
        ],
        [
            TRAIT_KEY.featTraits,
            'Dragonmark',
            'Physical manifestations of the Draconic Prophecy. They are more intricate than a birthmark and more distinct than a tattoo.',
        ],
    ];
    
    patchTraits(listOfNewTraits);
    mergeTraits();
});

function patchTraits(listOfNewTraits) {
    try {
        listOfNewTraits.forEach((args) => makePatch(...args));
    } catch (e) {
        console.log('PF2EX error', e.message);
    }
}

function makePatch(type, name, description) {
    const [shortKey, pf2eKey] = keyMaker(name);
    myPatchHelper(type, shortKey, pf2eKey, name, description);
}

function keyMaker(name) {
    const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    return [
        String(name).toLowerCase().replace(/\s/g, ''),
        capitalize(name).replace(/\s/g, ''),
    ];
}

function myPatchHelper(
    configKey = '',
    shortKey,
    pf2eKey,
    name,
    description = ''
) {
    CONFIG[configKey][shortKey] = `PF2E.${pf2eKey}`;
    CONFIG.PF2E[configKey][shortKey] = name;

    //If not featTraits, then also update featTraits
    if (configKey !== TRAIT_KEY.featTraits) {
        CONFIG[TRAIT_KEY.featTraits][shortKey] = `PF2E.${pf2eKey}`;
        CONFIG.PF2E[TRAIT_KEY.featTraits][shortKey] = name;
    }

    //Check if Description should be updated
    if (configKey.includes('Traits') && description) {
        const descKey = 'TraitDescription' + pf2eKey.replace('Trait', '');
        CONFIG.traitsDescriptions[shortKey] = `PF2E.${descKey}`;
        CONFIG.PF2E.traitsDescriptions[shortKey] = description;
    }
}

function mergeTraits() {
    mergeObject(CONFIG.magicTraditions, CONFIG.spellTraditions);
    mergeObject(CONFIG.ancestryItemTraits, CONFIG.ancestryTraits);
    mergeObject(CONFIG.weaponTraits, CONFIG.classTraits);
    mergeObject(CONFIG.weaponTraits, CONFIG.ancestryTraits);
    mergeObject(CONFIG.weaponTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.weaponTraits, CONFIG.spellTraditions);
    mergeObject(CONFIG.armorTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.armorTraits, CONFIG.spellTraditions);
    mergeObject(CONFIG.equipmentTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.equipmentTraits, CONFIG.ancestryTraits);
    mergeObject(CONFIG.equipmentTraits, CONFIG.spellTraditions);
    mergeObject(CONFIG.consumableTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.consumableTraits, CONFIG.spellTraditions);
    mergeObject(CONFIG.spellTraits, CONFIG.damageTypes);
    mergeObject(CONFIG.spellTraits, CONFIG.spellTraditions);
    mergeObject(CONFIG.spellTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.spellTraits, CONFIG.classTraits);
    mergeObject(CONFIG.featTraits, CONFIG.ancestryTraits);
    mergeObject(CONFIG.featTraits, CONFIG.classTraits);
    mergeObject(CONFIG.featTraits, CONFIG.spellTraditions);
    mergeObject(CONFIG.featTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.featTraits, CONFIG.damageTypes);
    mergeObject(CONFIG.featTraits, CONFIG.spellTraits);
    mergeObject(CONFIG.monsterTraits, CONFIG.ancestryTraits);
    mergeObject(CONFIG.monsterTraits, CONFIG.damageTypes);
    mergeObject(CONFIG.hazardTraits, CONFIG.damageTypes);
    mergeObject(CONFIG.hazardTraits, CONFIG.magicalSchools);
    mergeObject(CONFIG.hazardTraits, CONFIG.damageTypes);
    mergeObject(CONFIG.hazardTraits, CONFIG.rarityTraits);
}

function mergeObject(
    original,
    other = {},
    {
        insertKeys = true,
        insertValues = true,
        overwrite = true,
        recursive = true,
        inplace = true,
        enforceTypes = false,
    } = {},
    _d = 0
) {
    other = other || {};
    if (!(original instanceof Object) || !(other instanceof Object)) {
        throw new Error('One of original or other are not Objects!');
    }
    let depth = _d + 1;

    // Maybe copy the original data at depth 0
    if (!inplace && _d === 0) original = duplicate(original);

    // Enforce object expansion at depth 0
    if (_d === 0 && Object.keys(original).some((k) => /\./.test(k))) {
        original = expandObject(original);
    }

    if (_d === 0 && Object.keys(other).some((k) => /\./.test(k))) {
        other = expandObject(other);
    }

    // Iterate over the other object
    for (let [k, v] of Object.entries(other)) {
        let tv = getType(v);

        // Prepare to delete
        let toDelete = false;
        if (k.startsWith('-=')) {
            k = k.slice(2);
            toDelete = v === null;
        }

        // Get the existing object
        let x = original[k];
        let has = original.hasOwnProperty(k);
        let tx = getType(x);

        // Ensure that inner objects exist
        if (!has && tv === 'Object') {
            x = original[k] = {};
            has = true;
            tx = 'Object';
        }

        // Case 1 - Key exists
        if (has) {
            // 1.1 - Recursively merge an inner object
            if (tv === 'Object' && tx === 'Object' && recursive) {
                mergeObject(
                    x,
                    v,
                    {
                        insertKeys: insertKeys,
                        insertValues: insertValues,
                        overwrite: overwrite,
                        inplace: true,
                        enforceTypes: enforceTypes,
                    },
                    depth
                );
            }

            // 1.2 - Remove an existing key
            else if (toDelete) {
                delete original[k];
            }

            // 1.3 - Overwrite existing value
            else if (overwrite) {
                if (tx && tv !== tx && enforceTypes) {
                    throw new Error(
                        `Mismatched data types encountered during object merge.`
                    );
                }

                original[k] = v;
            }

            // 1.4 - Insert new value
            else if (x === undefined && insertValues) {
                original[k] = v;
            }
        }

        // Case 2 - Key does not exist
        else if (!toDelete) {
            let canInsert =
                (depth === 1 && insertKeys) || (depth > 1 && insertValues);
            if (canInsert) original[k] = v;
        }
    }
    // Return the object for use
    return original;
}

const TRAIT_KEY = {
    levels: 'levels',
    abilities: 'abilities',
    attributes: 'attributes',
    dcAdjustments: 'dcAdjustments',
    skills: 'skills',
    martialSkills: 'martialSkills',
    saves: 'saves',
    currencies: 'currencies',
    preciousMaterialGrades: 'preciousMaterialGrades',
    preciousMaterials: 'preciousMaterials',
    armorPotencyRunes: 'armorPotencyRunes',
    armorResiliencyRunes: 'armorResiliencyRunes',
    armorPropertyRunes: 'armorPropertyRunes',
    weaponPotencyRunes: 'weaponPotencyRunes',
    weaponStrikingRunes: 'weaponStrikingRunes',
    weaponPropertyRunes: 'weaponPropertyRunes',
    damageTypes: 'damageTypes',
    resistanceTypes: 'resistanceTypes',
    stackGroups: 'stackGroups',
    weaknessTypes: 'weaknessTypes',
    weaponDamage: 'weaponDamage',
    healingTypes: 'healingTypes',
    weaponTypes: 'weaponTypes',
    weaponGroups: 'weaponGroups',
    weaponDescriptions: 'weaponDescriptions',
    usageTraits: 'usageTraits',
    rarityTraits: 'rarityTraits',
    spellTraditions: 'spellTraditions',
    spellOtherTraits: 'spellOtherTraits',
    magicTraditions: 'magicTraditions',
    magicalSchools: 'magicalSchools',
    spellSchools: 'spellSchools',
    classTraits: 'classTraits',
    ancestryTraits: 'ancestryTraits',
    ancestryItemTraits: 'ancestryItemTraits',
    weaponTraits: 'weaponTraits',
    armorTraits: 'armorTraits',
    equipmentTraits: 'equipmentTraits',
    consumableTraits: 'consumableTraits',
    spellTraits: 'spellTraits',
    featTraits: 'featTraits',
    monsterTraits: 'monsterTraits',
    hazardTraits: 'hazardTraits',
    traitsDescriptions: 'traitsDescriptions',
    weaponHands: 'weaponHands',
    itemBonuses: 'itemBonuses',
    damageDice: 'damageDice',
    damageDie: 'damageDie',
    weaponRange: 'weaponRange',
    weaponMAP: 'weaponMAP',
    weaponReload: 'weaponReload',
    armorTypes: 'armorTypes',
    armorGroups: 'armorGroups',
    consumableTypes: 'consumableTypes',
    preparationType: 'preparationType',
    areaTypes: 'areaTypes',
    spellBasic: 'spellBasic',
    areaSizes: 'areaSizes',
    alignment: 'alignment',
    attitude: 'attitude',
    skillList: 'skillList',
    spellComponents: 'spellComponents',
    spellCategories: 'spellCategories',
    spellTypes: 'spellTypes',
    spellLevels: 'spellLevels',
    featTypes: 'featTypes',
    featActionTypes: 'featActionTypes',
    actionTypes: 'actionTypes',
    actionsNumber: 'actionsNumber',
    actionCategories: 'actionCategories',
    proficiencyLevels: 'proficiencyLevels',
    heroPointLevels: 'heroPointLevels',
    actorSizes: 'actorSizes',
    speedTypes: 'speedTypes',
    prerequisitePlaceholders: 'prerequisitePlaceholders',
    senses: 'senses',
    bulkTypes: 'bulkTypes',
    conditionTypes: 'conditionTypes',
    pfsFactions: 'pfsFactions',
    pfsSchools: 'pfsSchools',
    immunityTypes: 'immunityTypes',
    languages: 'languages',
    spellScalingModes: 'spellScalingModes',
    attackEffects: 'attackEffects',
    monsterAbilities: 'monsterAbilities',
};
