import type { Meta, StoryObj } from '@storybook/react';
import { __COMPONENT_NAME__ } from './__COMPONENT_NAME__';

/**
 * __COMPONENT_NAME__ - __COMPONENT_DESCRIPTION__
 *
 * This component was created using the Hustle UI Create workflow.
 */
const meta: Meta<typeof __COMPONENT_NAME__> = {
  title: 'Components/__COMPONENT_NAME__',
  component: __COMPONENT_NAME__,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '__COMPONENT_DESCRIPTION__',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive', 'outline', 'ghost'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the component',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    children: {
      control: 'text',
      description: 'Content inside the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default primary variant
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary __COMPONENT_NAME__',
  },
};

/**
 * Secondary variant for less prominent actions
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary __COMPONENT_NAME__',
  },
};

/**
 * Destructive variant for dangerous actions
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Item',
  },
};

/**
 * Outline variant with border
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline __COMPONENT_NAME__',
  },
};

/**
 * Ghost variant with no background
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost __COMPONENT_NAME__',
  },
};

/**
 * Small size variant
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small __COMPONENT_NAME__',
  },
};

/**
 * Large size variant
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large __COMPONENT_NAME__',
  },
};

/**
 * Loading state with spinner
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled __COMPONENT_NAME__',
  },
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <__COMPONENT_NAME__ variant="primary">Primary</__COMPONENT_NAME__>
        <__COMPONENT_NAME__ variant="secondary">Secondary</__COMPONENT_NAME__>
        <__COMPONENT_NAME__ variant="destructive">Destructive</__COMPONENT_NAME__>
        <__COMPONENT_NAME__ variant="outline">Outline</__COMPONENT_NAME__>
        <__COMPONENT_NAME__ variant="ghost">Ghost</__COMPONENT_NAME__>
      </div>
      <div className="flex items-center gap-2">
        <__COMPONENT_NAME__ size="sm">Small</__COMPONENT_NAME__>
        <__COMPONENT_NAME__ size="md">Medium</__COMPONENT_NAME__>
        <__COMPONENT_NAME__ size="lg">Large</__COMPONENT_NAME__>
      </div>
    </div>
  ),
};
