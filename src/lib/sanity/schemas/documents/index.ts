import Questionnaire from './Questionnaire';

/**
 * Barrel export of Sanity document schemas.
 *
 * The order of document registration will affect the order they
 * are shown in the Studio UI (unless overriden in conf).
 */
const documentSchemas = [
  Questionnaire
]

export default documentSchemas;
