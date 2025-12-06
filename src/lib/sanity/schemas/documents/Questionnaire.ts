import { defineArrayMember, defineField, defineType } from "sanity";
import { BlockquoteIcon } from "@sanity/icons";

export default defineType({
  name: "questionnaire",
  title: "Questionnaire",
  type: "document",
  icon: BlockquoteIcon,
  groups: [
    {
      title: "Page",
      name: "page",
      default: true,
    },
  ],
  description: "Questionnaire is a set of questions for the determination players level",
  fields: [
    defineField({
      name: "title",
      description: "Questionnaire name",
      type: "string",
    }),
    defineField({
      name: "questions",
      title: "Questions",
      type: "array",
      group: "page",
      of: [defineArrayMember({
        title: "Question",
        name: "question",
        type: "object",
        fields: [
          defineField({
            name: "title",
            title: 'Question title',
            type: "string",
          }),
          defineField({
            name: "answers",
            title: "Answers",
            type: "array",
            of: [
              defineArrayMember({
                name: "answer",
                type: "object",
                fields: [
                  {
                    name: "answer_name",
                    title: "Answer name",
                    type: "string",
                  },
                  {
                    name: "answer_value",
                    title: "Answer value",
                    type: "string",
                  }
                ]
              }),
            ]
          }),
        ],
      })],
      validation: (rule) => rule.min(1).max(20),
    })
  ]
})
