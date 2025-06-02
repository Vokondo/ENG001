# README.md

# MAP Violation Monitoring System

## Overview

The MAP Violation Monitoring System is a web application designed to monitor Minimum Advertised Price (MAP) policy violations across multiple online retailer websites. The application utilizes AI agents to scrape product listings, detect prices below the Manufacturer’s Suggested Retail Price (MSRP), and display violations on a user-friendly dashboard.

## Features

- Real-time scraping of product listings
- AI-driven price extraction and validation
- Detection of MAP violations with severity levels
- Simple API for accessing products and violations
- Built-in monitoring and logging

## Architecture

### Core Setup

- **Node.js/TypeScript**: The application is built using Node.js and TypeScript for type safety and scalability.
- **Supabase**: Used for database management and authentication.
- **Clerk**: Handles user authentication via JWT.
- **OpenRouter**: Utilized for AI processing tasks.
- **Bright Data MCP**: Employed for scraping product listings.

### Database Design

The application uses a simplified database design with the following core tables:

- **Products**: Stores product details including name, brand, MAP price, and category.
- **Listings**: Contains retailer-specific product listings with their last scraped prices.
- **Violations**: Logs detected violations with relevant details.

## API Endpoints

- **GET /products**: List all products with current violations.
- **POST /scrape/:productId**: Trigger an immediate scrape for a specific product.
- **GET /violations**: Retrieve the current violations.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd map-monitor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables in the `.env` file.

4. Run the application:
   ```
   npm start
   ```

## Usage

Access the API endpoints using a tool like Postman or cURL to interact with the MAP Violation Monitoring System.

## Logging and Monitoring

The application uses Winston for structured logging and tracks key metrics such as daily scraping counts and violation counts.

## License

This project is licensed under the MIT License.