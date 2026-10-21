// The donation nudge's messages. One is chosen at random per visit.
//
// Every word of a quote is the resident's own, from the Stories section
// (src/components/Stories.jsx); every figure is one the site already states.
// Do not add a statistic, a dollar-impact claim or a person that the site
// does not already carry.
export const MESSAGES = [
  {
    id: 'muhammad',
    type: 'story',
    quote: 'Every day I have hope. That’s the best part.',
    name: 'Muhammad',
    meta: 'U.S. Army Veteran, The Crossings',
    copy: 'After eight years living in his car, Muhammad found stability at The Crossings. Help the next neighbor find a home.',
  },
  {
    id: 'joel',
    type: 'story',
    quote: 'Grace is a gift.',
    name: 'Joel',
    meta: 'Resident since 2019, Gosnold',
    copy: 'After an MS diagnosis cost him everything, Joel found stability at Gosnold and now works full time. Help the next neighbor find a home.',
  },
  {
    id: 'curtis',
    type: 'story',
    quote: 'I’m a person that worked real hard and worked all my life.',
    name: 'Curtis',
    meta: 'Resident for 4 years, Studios at South Richmond',
    copy: 'After three years homeless, Curtis found community at Studios at South Richmond. Help the next neighbor find a home.',
  },
  {
    id: 'mark',
    type: 'story',
    quote: 'When will it be my time for something good?',
    name: 'Mark',
    meta: 'Resident since 2014, Hampton Roads',
    copy: 'After ten years on the streets, Mark found housing through SupportWorks. Help the next neighbor find a home.',
  },
  {
    id: 'retention',
    type: 'stat',
    eyebrow: 'Housing works',
    stat: '96%',
    suffix: '+',
    lede: 'of the people we house do not return to homelessness.',
    copy: 'Your gift today helps the next neighbor find a home and keep it.',
    pill: 'stay housed',
  },
  {
    id: 'served',
    type: 'stat',
    eyebrow: 'Every year',
    stat: '1,650',
    suffix: '',
    lede: 'people served across Virginia.',
    copy: 'Older adults, veterans, and persons with disabilities. Your gift today helps the next neighbor.',
    pill: 'served each year',
  },
];
