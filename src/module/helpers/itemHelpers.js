import * as c from "../constants.js";

/**
 * Update encumbrance when actor items change
 * @param {Object} actor
 */
export const updateActorEncumbrance = async (actor) => {
  const items = actor.items;
  // Calculate encumbrance
  let encEquipped = 0;
  let encStored = 0;
  const equippedArmour = items.filter((item) => item.type === c.ARMOUR && item.system.equippedStatus === c.EQUIPPED);
  encEquipped = encEquipped + getEncumbranceForItems(equippedArmour);
  encEquipped =
    encEquipped +
    getEncumbranceForItems(
      items.filter((item) => item.type === c.WEAPON && item.system.equippedStatus === c.EQUIPPED)
    );
  encEquipped =
    encEquipped +
    getEncumbranceForItems(
      items.filter((item) => item.type === c.GEAR && item.system.equippedStatus === c.EQUIPPED)
    );
  encStored =
    encStored +
    getEncumbranceForItems(
      items.filter((item) => item.type === c.ARMOUR && item.system.equippedStatus === c.STORED)
    );
  encStored =
    encStored +
    getEncumbranceForItems(
      items.filter((item) => item.type === c.WEAPON && item.system.equippedStatus === c.STORED)
    );
  encStored =
    encStored +
    getEncumbranceForItems(items.filter((item) => item.type === c.GEAR && item.system.equippedStatus === c.STORED));

  await actor.update({
    data: {
      encumbrance: {
        equipped: encEquipped,
        stored: encStored,
      },
    },
  });
};

/**
 * Update AC when actor items change
 * @param {Object} actor
 */
export const updateActorArmourClass = async (actor) => {
  const items = actor.items;
  const equippedArmour = items.filter((item) => item.type === c.ARMOUR && item.system.equippedStatus === c.EQUIPPED);

  // Calculate armour class
  let ac = 0;
  if (equippedArmour.length > 0) {
    ac = getArmourClassForItems(equippedArmour);
  }

  await actor.update({
    data: {
      combat: {
        armourClass: ac,
      },
    },
  });
};

/**
 * Update Vocation and Species for actor when actor items change
 * @param {Object} actor
 */
export const updateActorGroups = async (actor) => {
  const items = actor.items;

  // Get vocation and species
  const speciesObj = items.filter((item) => item.type === c.ABILITY && item.system.type === c.SPECIES);
  const vocationObj = items.filter((item) => item.type === c.ABILITY && item.system.type === c.VOCATION);
  const species = speciesObj.length > 0 ? speciesObj[0].name : game.settings.get("whitehack3e", "defaultSpecies");
  const vocation = vocationObj.length > 0 ? vocationObj[0].name : c.EMPTYSTRING;

  await actor.update({
    data: {
      basics: {
        vocation: vocation,
        species: species,
      },
    },
  });
};

const getArmourClassForItems = (items) => {
  let maxAc = 0;
  let shieldHelmAc = 0;
  items.forEach((item) => {
    let tempAc = item.system.armourClass;
    if (tempAc === c.PLUSONE) {
      shieldHelmAc = 1;
    } else if (tempAc !== c.SPECIAL) {
      tempAc = +tempAc;
      maxAc = tempAc > maxAc ? tempAc : maxAc;
    }
  });
  return maxAc + shieldHelmAc;
};

const getEncumbranceForItems = (items) => {
  let encCount = 0;
  items.forEach((item) => {
    if (item.type == c.WEAPON || item.type === c.GEAR) {
      const quantity = item.system.quantity === undefined ? 1 : item.system.quantity;
      switch (item.system.weight) {
        case c.REGULAR:
          encCount = encCount + quantity;
          break;
        case c.HEAVY:
          encCount = encCount + quantity * 2;
          break;
        case c.MINOR:
          encCount = encCount + quantity / 2;
          break;
        case c.SMALL:
          encCount = encCount + quantity / 5;
          break;
        case c.NEGLIGIBLE:
          encCount = encCount + quantity / 100;
          break;
        default:
          encCount = encCount++;
      }
    } else {
      if (item.system.armourClass !== c.SPECIAL && item.system.armourClass !== c.PLUSONE) {
        encCount = encCount + +item.system.armourClass;
      } else {
        encCount = encCount + 1;
      }
    }
  });
  return encCount;
};
