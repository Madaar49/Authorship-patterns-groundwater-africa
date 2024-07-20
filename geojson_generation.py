# Import relevant modules
import pandas as pd
import geopandas as gpd
import geojson
import os

# Load data Suplementary Data in CSV format
Suplementary_Data = pd.read_csv(
    'Supplementary Data.csv',
    nrows=55,
    thousands='.',
    decimal=',',
    sep=';'
)

# Load shapefile data
Africa_shp = gpd.read_file('Shapefiles/Africa_RO1.shp')

# Correct the country code for Western Sahara
Africa_shp.at[54, 'ISO_3DIGIT'] = 'ESH'

# Merge CSV data with shapefile data
ROA = Africa_shp[['ISO_2DIGIT', 'ISO_3DIGIT', 'NAME', 'geometry']].merge(
    Suplementary_Data,
    how='inner',
    left_on='ISO_3DIGIT',
    right_on='Country Code'
).drop(columns=['ISO_2DIGIT']).fillna(0)

# Convert to GeoDataFrame
ROA_final = gpd.GeoDataFrame(ROA, crs="EPSG:4326")

def get_geojson_files(processed_geodataframe):

    """
    Functions that convert specified columns of a GeoDataFrame to GeoJSON files.
    """

    # Columns of interest
    columns_to_convert = [
        'No of articles [-]',
        'Helicopter research index (HRI) [-]',
        'Local co-author [%]',
        'African (co-)author [%]',
        'Local corresponding author [%]'
    ]

    # Create a new column combining Country and country code
    processed_geodataframe["Country_code"] = processed_geodataframe["Country"] + ' [' + processed_geodataframe["ISO_3DIGIT"] + ']'

    # Loop through columns and convert each to GeoJSON
    for column in columns_to_convert:

        # Create a new GeoDataFrame with the column, Country_code and geometry
        loop_gdf = processed_geodataframe[[column, 'Country_code', 'geometry']].rename(columns={column: 'value'})

        # Convert the GeoDataFrame to GeoJSON
        geojson_file = loop_gdf.to_json()

        # Define the filename
        filename = f"data/{column}.geojson"
        
        # Save the GeoJSON to a file
        os.makedirs(os.path.dirname(filename), exist_ok=True) 
        with open(filename, 'w') as f:
            f.write(geojson_file)

        # print(f"Saved {column} to {filename}")

# Generate the GeoJSON files
get_geojson_files(ROA_final)
