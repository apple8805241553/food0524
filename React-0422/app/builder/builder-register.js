// builder-register.js
import { Builder } from '@builder.io/react'
import { ProductCard } from '../components/ProductCard'

Builder.registerComponent(ProductCard, {
  name: 'ProductCard',
  inputs: [
    {
      name: 'product',
      type: 'object',
      defaultValue: {
        type: 'digital',
        title: 'Awesome Course',
      },
    },
  ],
})

// Register the new e-commerce ProductCard
Builder.registerComponent(ProductCard, {
  name: 'EcommerceProductCard',
  inputs: [
    {
      name: 'product',
      type: 'object',
      defaultValue: {
        id: 1,
        image: '/placeholder.jpg',
        title: 'Product Title',
        description: 'Product Description',
        price: 100,
        isFavorite: false,
      },
    },
  ],
})
